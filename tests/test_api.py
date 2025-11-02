from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should be a dict and contain known activity
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    test_email = "test_student@example.com"

    # Ensure test email is not already present
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {test_email} for {activity}"
    assert test_email in activities[activity]["participants"]

    # Sign up again should fail
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 400

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {test_email} from {activity}"
    assert test_email not in activities[activity]["participants"]

    # Unregister again should return 404
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 404
