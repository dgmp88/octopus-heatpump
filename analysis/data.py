import base64
from typing import Literal

import requests
import pandas as pd

from analysis import env


# Fetch electricity consumption
ELECTRICITY_URL = f"{env.OCTOPUS_BASE_URL}/electricity-meter-points/{env.ELECTRICITY_MPAN}/meters/{env.ELECTRICITY_SERIAL}/consumption/"

# Fetch gas consumption
GAS_URL = f"{env.OCTOPUS_BASE_URL}/gas-meter-points/{env.GAS_MPRN}/meters/{env.GAS_SERIAL}/consumption/"


def fetch_consumption(
    source: Literal["electricity", "gas"],
    periodFrom="2023-01-01T00:00:00Z",
    periodTo="2024-11-20T00:00:00Z",
) -> pd.DataFrame:
    url_suffix = f"?period_from={periodFrom}&period_to={periodTo}&group_by=day"
    prefix = ELECTRICITY_URL if source == "electricity" else GAS_URL

    url = prefix + url_suffix

    results = []
    # Base 64 encode the API key
    b64_api_key = base64.b64encode(env.OCTOPUS_API_KEY.encode())

    while True:
        response = requests.get(
            url, headers={"Authorization": f"Basic {b64_api_key.decode()}:"}
        )
        response_json = response.json()
        results.extend(response_json["results"])

        next_url = response_json.get("next")
        if next_url:
            print("got next...")
            url = response_json["next"]
        else:
            break

    df = pd.DataFrame(results)
    df["interval_start"] = pd.to_datetime(df["interval_start"], utc=True)
    df["interval_end"] = pd.to_datetime(df["interval_end"], utc=True)
    return df
