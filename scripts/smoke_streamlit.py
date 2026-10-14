"""Check the legacy Streamlit page starts without runtime exceptions.

Upload widget interactions are intentionally NOT covered by AppTest.
"""
from streamlit.testing.v1 import AppTest

app = AppTest.from_file("app.py").run(timeout=30)
assert len(app.exception) == 0, [x.message for x in app.exception]
assert len(app.title) >= 1, "Expected Streamlit dashboard title"
print("Legacy Streamlit initial-screen smoke test passed")
