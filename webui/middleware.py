"""Per-request middleware: validate webui session cookie, chdir into that
user's data directory, then reload AuthInstance/BookmarkInstance from disk
so all downstream code sees their files.

Important: chdir is process-global. For our small/personal-use scale this is
acceptable. If we ever go fully concurrent we should switch to context-vars
or per-request Auth instances.
"""
import os
from pathlib import Path

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse, Response
from starlette.types import ASGIApp

from webui.users import (
    COOKIE_NAME, PROJECT_DIR, USERS_DIR,
    parse_session_token, get_user, user_dir,
)
from webui.context import current_user_dir

# Routes accessible without auth:
PUBLIC_PATHS = (
    "/u/login",
    "/u/register",
    "/u/logout",      # logout itself is harmless
    "/static/",
    "/favicon",
    "/u/api/",        # reserved for future public AJAX
)


class WebUIAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request, call_next):
        path = request.url.path
        is_public = any(path == p.rstrip("/") or path.startswith(p) for p in PUBLIC_PATHS)

        token = request.cookies.get(COOKIE_NAME)
        username = parse_session_token(token) if token else None
        user = get_user(username) if username else None

        if not user:
            if is_public:
                return await call_next(request)
            accept = request.headers.get("accept", "")
            if "text/html" in accept or accept == "" or accept == "*/*":
                return RedirectResponse(url=f"/u/login?next={path}", status_code=303)
            return Response("Unauthorized", status_code=401)

        # Authenticated: Set ContextVar instead of using blocking Global CWD Lock
        udir = user_dir(user["username"])
        udir.mkdir(parents=True, exist_ok=True)

        for fn, default in (
            ("refresh-tokens.json", "[]"),
        ):
            p = udir / fn
            if not p.exists():
                p.write_text(default, encoding="utf-8")
        (udir / "decoy_data").mkdir(exist_ok=True)

        # SET CONTEXTVAR - Supported natively by async/await and thread pools
        token_ctx = current_user_dir.set(udir)

        try:
            # Safe to reload Auth & Bookmark without Global Lock
            # because they now use `resolve_path()` to dynamically point to the correct user dir
            # based on current_user_dir context
            try:
                from app.service.auth import AuthInstance
                AuthInstance.reload_for_current_dir()
            except Exception:
                pass
            try:
                from app.service.bookmark import BookmarkInstance
                BookmarkInstance.reload_for_current_dir()
            except Exception:
                pass
            try:
                from app.service.decoy import DecoyInstance
                DecoyInstance.reset_decoys()
            except Exception:
                pass

            request.state.webui_user = user
            request.state.webui_user_dir = str(udir)

            # Execution moves to FastAPI Route without blocking other users
            response = await call_next(request)
            return response
        finally:
            current_user_dir.reset(token_ctx)

