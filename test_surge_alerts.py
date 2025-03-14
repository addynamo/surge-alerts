import requests
import time
from datetime import datetime

BASE_URL = 'http://localhost:5000'

def test_surge_alerts():
    # Test data
    handle = 'testuser'
    config_data = {
        'surge_reply_count_per_period': 5,
        'surge_reply_period_in_ms': 300000,  # 5 minutes
        'alert_cooldown_period_in_ms': 900000,  # 15 minutes
        'emails_to_notify': ['admin@example.com'],
        'enabled': True
    }

    try:
        # Step 1: Create surge alert configuration
        print("Creating surge alert configuration...")
        response = requests.post(
            f'{BASE_URL}/surge-alert/{handle}/config',
            json=config_data
        )
        assert response.status_code == 201
        config_id = response.json()['id']
        print("Configuration created successfully")

        # Step 2: Get throughput metrics
        print("\nGetting throughput metrics...")
        response = requests.get(f'{BASE_URL}/surge-alert/throughput/{handle}')
        assert response.status_code == 200
        print("Current metrics:", response.json())

        # Step 3: Generate some hidden replies (this would normally happen through the reply API)
        print("\nCreating test replies...")
        for i in range(6):
            response = requests.post(f'{BASE_URL}/api/replies', json={
                'handle': handle,
                'reply_id': f'reply_{int(time.time())}_{i}',
                'content': 'bad content'  # This should trigger hiding
            })
            assert response.status_code == 200
            time.sleep(1)  # Space out the replies

        # Step 4: Get updated throughput metrics
        print("\nGetting updated throughput metrics...")
        response = requests.get(f'{BASE_URL}/surge-alert/throughput/{handle}')
        assert response.status_code == 200
        print("Updated metrics:", response.json())

        # Step 5: Process notifications
        print("\nProcessing notifications...")
        response = requests.post(f'{BASE_URL}/surge-alert/notify')
        assert response.status_code == 200
        print("Notifications processed:", response.json())

        # Step 6: Update configuration
        print("\nUpdating configuration...")
        config_data['surge_reply_count_per_period'] = 10
        response = requests.put(
            f'{BASE_URL}/surge-alert/{handle}/config/{config_id}',
            json=config_data
        )
        assert response.status_code == 200
        print("Configuration updated successfully")

        # Step 7: List all configurations
        print("\nListing all configurations...")
        response = requests.get(f'{BASE_URL}/surge-alert/{handle}/config')
        assert response.status_code == 200
        print("Configurations:", response.json())

        print("\nAll tests passed successfully!")

    except AssertionError:
        print(f"Test failed with status code {response.status_code}")
        print("Response:", response.text)
    except Exception as e:
        print(f"Test failed with error: {str(e)}")

if __name__ == '__main__':
    test_surge_alerts()
