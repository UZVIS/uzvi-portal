def pytest_configure(config):
    config.addinivalue_line(
        "filterwarnings",
        "ignore:datetime.datetime.utcnow:DeprecationWarning",
    )
