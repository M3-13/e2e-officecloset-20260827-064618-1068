"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse

from . import models
from .config import get_cors_origin, get_jwt_secret
from .db import engine
from .routers import auth, items, outfits, users

logger = logging.getLogger(__name__)

_STATUS_CODE_MAP = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "validation_error",
    429: "too_many_requests",
    500: "internal_server_error",
    501: "not_implemented",
}


def _detail_message(detail: object) -> str:
    if isinstance(detail, str):
        return detail
    if isinstance(detail, dict):
        return str(detail.get("message", detail.get("detail", "Error")))
    return str(detail)


def _validation_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Validation error"
    parts = []
    for err in errors[:3]:
        loc = ".".join(str(p) for p in err.get("loc", []))
        msg = err.get("msg", "invalid")
        parts.append(f"{loc}: {msg}" if loc else msg)
    return "; ".join(parts)


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_jwt_secret()
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Vestiaire API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_cors_origin()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = _STATUS_CODE_MAP.get(exc.status_code, "http_error")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": _detail_message(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": _validation_message(exc)}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_server_error", "message": "Internal Server Error"}},
    )


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(items.router, prefix="/api/wardrobe", tags=["items"])
app.include_router(outfits.router, prefix="/api/outfits", tags=["outfits"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
