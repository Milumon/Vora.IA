"""Setup file for vora-backend package."""
from setuptools import setup, find_packages

setup(
    name="vora-backend",
    version="1.0.0",
    packages=find_packages(exclude=["tests", "tests.*"]),
    python_requires=">=3.10",
)
