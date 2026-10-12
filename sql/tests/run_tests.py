#!/usr/bin/env python3
"""
Test runner script for PayPulse MySQL Database System test suite.
Executes pytest against the active MySQL 8.4 database and outputs a formatted report.
"""

import sys
import subprocess
import os

def run_tests():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    venv_pytest = os.path.join(script_dir, ".venv", "bin", "pytest")
    pytest_bin = venv_pytest if os.path.exists(venv_pytest) else "pytest"
    
    test_file = os.path.join(script_dir, "test_database.py")
    
    print("=" * 70)
    print(" PAYPULSE DATABASE SYSTEM — AUTOMATED VERIFICATION SUITE")
    print(f" Target DBMS: MySQL 8.4 LTS | Test File: {test_file}")
    print("=" * 70)
    
    cmd = [pytest_bin, "-v", test_file]
    result = subprocess.run(cmd)
    
    print("=" * 70)
    if result.returncode == 0:
        print(" [PASSED] ALL 18 DATABASE ENGINEERING TEST CASES PASSED SUCCESSFULLY.")
    else:
        print(f" [FAILED] TEST SUITE FAILED WITH EXIT CODE {result.returncode}")
    print("=" * 70)
    
    sys.exit(result.returncode)

if __name__ == "__main__":
    run_tests()
