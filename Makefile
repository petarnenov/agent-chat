# Single definition of the repository checks: the pre-push gate and CI verify.
NODE_PIN := $(shell cat .nvmrc)
NPM_PIN := $(shell sed -n 's/.*npm install --global npm@\([0-9.]*\) --ignore-scripts.*/\1/p' .github/workflows/release.yml | head -n 1)

.PHONY: verify verify-checks toolchain hooks doctor setup test

# Uses the .nvmrc Node.js when nvm has it, so no 'nvm use' is needed first.
verify:
	@NODE_PIN=$(NODE_PIN) bash scripts/with-pinned-node.sh use $(MAKE) --no-print-directory verify-checks

verify-checks: toolchain
	npm run verify:comments
	$(MAKE) --no-print-directory test
	npm run check:types
	npm run verify:dependencies
	npm run openspec -- validate --all --strict --no-interactive
	npm run verify:archive

toolchain:
	@node_version="$$(node -v 2>/dev/null || echo 'none')"; \
	if [ "$$node_version" != "v$(NODE_PIN)" ]; then \
		echo "make verify: Node $$node_version does not match .nvmrc (v$(NODE_PIN)). With nvm, run make setup to install Node.js $(NODE_PIN); without nvm, install Node.js $(NODE_PIN) yourself." >&2; \
		exit 1; \
	fi
	@npm_version="$$(npm -v)"; \
	if [ "$$npm_version" != "$(NPM_PIN)" ]; then \
		echo "make verify: npm $$npm_version does not match the CI pin ($(NPM_PIN)). Run make setup." >&2; \
		exit 1; \
	fi

hooks:
	git config core.hooksPath .githooks

# Runs the compiled product tests with coverage thresholds and the scope check.
test:
	@NODE_PIN=$(NODE_PIN) bash scripts/with-pinned-node.sh use npm test

# Checks that this clone can build and verify; changes nothing.
doctor:
	@NODE_PIN=$(NODE_PIN) NPM_PIN=$(NPM_PIN) bash scripts/with-pinned-node.sh use bash scripts/run-node-script.sh scripts/doctor.ts

# Installs what is missing: the .nvmrc Node.js, the npm pin, the locked
# dependencies, and the pre-push hook.
setup:
	@NODE_PIN=$(NODE_PIN) NPM_PIN=$(NPM_PIN) bash scripts/with-pinned-node.sh install bash scripts/run-node-script.sh scripts/setup.ts
