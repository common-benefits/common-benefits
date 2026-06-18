RUNTIME_PREFIX := poetry run
.PHONY: install format lint test check-format check-lint check-types check-types-pyright checks

install:
	poetry install

format:
	$(RUNTIME_PREFIX) black .

lint:
	$(RUNTIME_PREFIX) ruff check .

test:
	$(RUNTIME_PREFIX) pytest

check-format:
	$(RUNTIME_PREFIX) black . --check

check-lint:
	$(RUNTIME_PREFIX) ruff check .

check-types:
	$(RUNTIME_PREFIX) mypy .

check-types-pyright:
	$(RUNTIME_PREFIX) pyright

checks: check-format check-lint check-types check-types-pyright test
