RUNTIME_PREFIX := poetry run
MARKDOWN := README.md src examples
.PHONY: install format lint test check-format check-lint check-types checks

install:
	poetry install

format:
	$(RUNTIME_PREFIX) black .
	$(RUNTIME_PREFIX) mdformat $(MARKDOWN)

lint:
	$(RUNTIME_PREFIX) ruff check .

test:
	$(RUNTIME_PREFIX) pytest

check-format:
	$(RUNTIME_PREFIX) black . --check
	$(RUNTIME_PREFIX) mdformat --check $(MARKDOWN)

check-lint:
	$(RUNTIME_PREFIX) ruff check .

check-types:
	$(RUNTIME_PREFIX) pyright

checks: check-format check-lint check-types test
