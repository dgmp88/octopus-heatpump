import dotenv
import os

dotenv.load_dotenv()

OCTOPUS_BASE_URL = "https://api.octopus.energy/v1"
OCTOPUS_API_KEY = os.getenv("OCTOPUS_API_KEY")
ELECTRICITY_MPAN = os.getenv("METER_MPAN")
ELECTRICITY_SERIAL = os.getenv("METER_SERIAL")
GAS_MPRN = os.getenv("GAS_MPRN")  # Add this to your .env file
GAS_SERIAL = os.getenv("GAS_SERIAL")  # Add this to your .env file
