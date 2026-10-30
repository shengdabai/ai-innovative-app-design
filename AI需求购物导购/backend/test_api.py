"""Offline route-unit tests: replace FastAPI only; use the real Pydantic models.

These tests do not verify HTTP routing, CORS, or ASGI response serialization.
No server, credentials, environment files, or external services are used.
"""
import asyncio
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import Mock, patch

from pydantic import ValidationError


class RouteError(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail


def load_api():
    app = Mock()
    app.get.side_effect = lambda *args, **kwargs: lambda handler: handler
    app.post.side_effect = lambda *args, **kwargs: lambda handler: handler
    fastapi = types.ModuleType('fastapi')
    fastapi.FastAPI = Mock(return_value=app)
    fastapi.HTTPException = RouteError
    cors = types.ModuleType('fastapi.middleware.cors')
    cors.CORSMiddleware = Mock()
    spec = importlib.util.spec_from_file_location(
        'shopping_api_unit', Path(__file__).parent / 'app' / 'main.py'
    )
    module = importlib.util.module_from_spec(spec)
    # Test import has a clean environment; the production module does not load .env.
    with patch.dict(os.environ, {}, clear=True), patch.dict(sys.modules, {
        'fastapi': fastapi, 'fastapi.middleware': types.ModuleType('fastapi.middleware'),
        'fastapi.middleware.cors': cors, 'shopping_api_unit': module,
    }):
        spec.loader.exec_module(module)
    return module


class AnalysisRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.api = load_api()

    def test_whitespace_only_input_is_rejected(self):
        for text in ['', '  ', '\n\t', '\u3000']:
            with self.subTest(text=repr(text)), self.assertRaises(ValidationError):
                self.api.UserInput(text=text)

    def test_input_is_trimmed_before_analysis(self):
        request = self.api.UserInput(text='  遮光眼罩\n')
        analyzer = Mock()
        analyzer.analyze_user_need.return_value = {'fixture': True}
        with patch.object(self.api, 'need_analyzer', analyzer):
            self.assertEqual(asyncio.run(self.api.analyze_need(request)), {'fixture': True})
        analyzer.analyze_user_need.assert_called_once_with('遮光眼罩')

    def test_input_length_boundary(self):
        self.assertEqual(len(self.api.UserInput(text='光' * 2000).text), 2000)
        with self.assertRaises(ValidationError):
            self.api.UserInput(text='光' * 2001)

    def test_non_string_input_is_rejected(self):
        for text in [None, 1, [], {}]:
            with self.subTest(text=text), self.assertRaises(ValidationError):
                self.api.UserInput(text=text)

    def test_internal_errors_are_not_returned_or_printed(self):
        marker = 'synthetic-private-input-and-internal-path'
        analyzer = Mock()
        analyzer.analyze_user_need.side_effect = RuntimeError(marker)
        output = io.StringIO()
        with patch.object(self.api, 'need_analyzer', analyzer), \
                contextlib.redirect_stderr(output), contextlib.redirect_stdout(output):
            with self.assertRaises(RouteError) as caught:
                asyncio.run(self.api.analyze_need(self.api.UserInput(text='眼罩')))
        self.assertEqual(caught.exception.status_code, 500)
        self.assertEqual(caught.exception.detail, 'Analysis service temporarily unavailable')
        self.assertNotIn(marker, output.getvalue())
        self.assertIsNone(caught.exception.__cause__)
        self.assertTrue(caught.exception.__suppress_context__)


if __name__ == '__main__':
    unittest.main()
