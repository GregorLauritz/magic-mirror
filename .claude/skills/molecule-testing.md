# Molecule Testing for Ansible Roles

## Project context

This repo uses **Molecule 6+ with the Docker driver** to test four roles:
- `generate_env_files` — writes env file templates
- `generate_certs` — runs mkcert to generate SSL certs
- `setup_env` — composes generate_env_files (local dev playbook role)
- `setup_certs` — installs mkcert + composes generate_certs (local dev playbook role)

Each role has a scenario at `ansible/roles/<role>/molecule/default/`.

---

## Known pitfalls and fixes (learned the hard way)

### 1. ANSIBLE_ROLES_PATH — sibling roles not found

**Symptom:** `ansible-playbook --syntax-check converge.yml` fails with role not found.

**Cause:** Molecule 6 does NOT automatically add the role parent directory to
`ANSIBLE_ROLES_PATH`. The old `config_options.defaults.roles_path: ../../..`
workaround resolves relative to Molecule's ephemeral temp dir, not the repo root.

**Fix (CI):** Set an absolute path in the GitHub Actions workflow step env:
```yaml
env:
  ANSIBLE_ROLES_PATH: "${{ github.workspace }}/ansible/roles"
```

**Fix (local):** Run molecule with the env var set:
```bash
ANSIBLE_ROLES_PATH=../.. molecule test
# or export it in your shell for the session
```

Do NOT use `config_options.defaults.roles_path` — relative paths resolve
against the ephemeral directory, not the project root.

---

### 2. Python3 not pre-installed in ubuntu:24.04

**Symptom:** Every module fails with `The module interpreter '/usr/bin/python3' was not found`.

**Cause:** `docker.io/ubuntu:24.04` ships without Python3. Ansible modules
(including `gather_facts`) all require Python on the target.

**Fix:** Add a `prepare.yml` that bootstraps Python3 using `ansible.builtin.raw`
(the only module that works without Python):
```yaml
- name: Prepare
  hosts: all
  gather_facts: false
  tasks:
    - name: Bootstrap Python3
      ansible.builtin.raw: apt-get update -qq && apt-get install -y python3
      changed_when: true
```

If the role also uses `become: true`, also install `sudo`:
```yaml
ansible.builtin.raw: apt-get update -qq && apt-get install -y python3 sudo
```

If a task after bootstrapping needs facts (e.g. `ansible_architecture`),
keep `gather_facts: false` and call `ansible.builtin.setup` explicitly after
the bootstrap task.

---

### 3. become: true requires sudo in Docker

**Symptom:** Tasks with `become: true` fail with `sudo: not found`.

**Cause:** The ubuntu:24.04 image has no `sudo`. Molecule containers run as
root, so `become` is unnecessary but if the role uses it, sudo must exist.

**Fix:** Install sudo in `prepare.yml` alongside Python3 (see above).
The container runs as root so sudo will work without sudoers config.

---

### 4. Idempotency failures — changed_when: true

**Symptom:** Molecule idempotency check fails on tasks that always report `changed`.

**Cause:** Tasks with hardcoded `changed_when: true` always report changed,
even if they produce no real change on a second run.

**Fix A — use `creates` (preferred for file-generating commands):**
```yaml
- name: Generate SSL certificate
  ansible.builtin.command: mkcert -cert-file /path/to/cert.pem ...
  args:
    creates: /path/to/cert.pem   # skip if output file already exists
```

**Fix B — use `changed_when: false` (for always-safe re-runnable commands):**
```yaml
- name: Install mkcert root CA
  ansible.builtin.command: mkcert -install
  changed_when: false   # idempotent by design; mkcert handles "already installed"
```

---

### 5. Verify: hardcoded binary paths

**Symptom:** `verify.yml` stat assertion fails because the binary is at a
different path than expected.

**Cause:** `apt install mkcert` installs to `/usr/bin/mkcert`, but a manual
binary install uses `/usr/local/bin/mkcert`. Hardcoding one path breaks the other.

**Fix:** Use `which` to verify the binary is in PATH regardless of location:
```yaml
- name: Check mkcert is in PATH
  ansible.builtin.command: which mkcert
  changed_when: false
  register: mkcert_which
  failed_when: false

- name: Assert mkcert is installed
  ansible.builtin.assert:
    that: mkcert_which.rc == 0
    fail_msg: "mkcert not found in PATH"
```

---

## Molecule scenario file checklist

### molecule.yml
```yaml
driver:
  name: docker

platforms:
  - name: instance
    image: docker.io/ubuntu:24.04
    pre_build_image: true

provisioner:
  name: ansible
  inventory:
    group_vars:
      all:
        # mirror ansible/inventory/group_vars/all/main.yml values here

verifier:
  name: ansible
```
- No `config_options` block — it breaks ANSIBLE_ROLES_PATH resolution.

### prepare.yml
- Always needed for ubuntu:24.04 — bootstrap Python3 (+ sudo if role uses become).
- Set `gather_facts: false`.
- If role needs `ansible_architecture` or other facts: call `ansible.builtin.setup`
  explicitly after the bootstrap raw task.

### converge.yml
- Supply vars that would normally come from `vars_prompt` (e.g. secrets, domain).
- Override path vars (e.g. `repo_root: /tmp/test-...`) so files land in /tmp.
- Create prerequisite directories in `pre_tasks` if the role doesn't create them.

### verify.yml
- Check file existence with `ansible.builtin.stat` + `assert`.
- Check binary availability with `which` (not hardcoded paths).
- Validate file content/format with `openssl`, `grep`, etc. via `command`.

---

## Running molecule locally

```bash
cd ansible/roles/<role_name>
ANSIBLE_ROLES_PATH=../.. molecule test          # full test cycle
ANSIBLE_ROLES_PATH=../.. molecule converge      # create + prepare + converge only
ANSIBLE_ROLES_PATH=../.. molecule verify        # run verify on existing instance
ANSIBLE_ROLES_PATH=../.. molecule destroy       # tear down containers
```
