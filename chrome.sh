#!/usr/bin/env bash
# ungoogled-chromium installer for Arch / CachyOS
# OBS repo is dead as of 2023 — use AUR -bin or cachy-repo instead

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()      { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
die()     { echo -e "${RED}[ERR]${NC} $*"; exit 1; }

detect_aur_helper() {
    for h in paru yay; do command -v "$h" &>/dev/null && echo "$h" && return; done
    echo ""
}

ensure_base_devel() {
    pacman -Qq base-devel &>/dev/null || sudo pacman -S --needed --noconfirm base-devel
}

# Method 1: cachy-repo (CachyOS native — already set up, zero effort)
install_cachy_repo() {
    if pacman -Sl cachyos 2>/dev/null | grep -q "ungoogled-chromium"; then
        info "Found ungoogled-chromium in cachy-repo — installing via pacman..."
        sudo pacman -S --noconfirm ungoogled-chromium
        ok "Done via cachy-repo."
    else
        warn "ungoogled-chromium not found in cachy-repo, falling back to Chaotic-AUR..."
        install_chaotic_aur
    fi
}

# Method 2: Chaotic-AUR pre-built binary
install_chaotic_aur() {
    if ! grep -q "chaotic-aur" /etc/pacman.conf; then
        info "Adding Chaotic-AUR repo..."
        sudo pacman-key --recv-key 3056513887B78AEB --keyserver keyserver.ubuntu.com
        sudo pacman-key --lsign-key 3056513887B78AEB
        sudo pacman -U --noconfirm \
            'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-keyring.pkg.tar.zst' \
            'https://cdn-mirror.chaotic.cx/chaotic-aur/chaotic-mirrorlist.pkg.tar.zst'
        echo -e "\n[chaotic-aur]\nInclude = /etc/pacman.d/chaotic-mirrorlist" \
            | sudo tee -a /etc/pacman.conf > /dev/null
        sudo pacman -Sy
    else
        info "Chaotic-AUR already configured."
        sudo pacman -Sy
    fi
    sudo pacman -S --noconfirm ungoogled-chromium
    ok "Done via Chaotic-AUR."
}

# Method 3: AUR -bin (pre-compiled, no extra repo)
install_aur_bin() {
    ensure_base_devel
    local helper; helper=$(detect_aur_helper)
    if [[ -n "$helper" ]]; then
        info "Using $helper..."
        "$helper" -S --noconfirm ungoogled-chromium-bin
    else
        info "No AUR helper found — building manually..."
        local tmp; tmp=$(mktemp -d)
        git clone https://aur.archlinux.org/ungoogled-chromium-bin.git "$tmp"
        cd "$tmp" && makepkg -si --noconfirm
        cd - > /dev/null && rm -rf "$tmp"
    fi
    ok "Done via AUR -bin."
}

# Method 4: Full source build from AUR
install_aur_source() {
    warn "Source build takes 1–3+ hours, needs 8+ GB RAM and ~30 GB disk."
    read -rp "Continue? [y/N] " c; [[ "${c,,}" == "y" ]] || exit 0
    ensure_base_devel
    local helper; helper=$(detect_aur_helper)
    if [[ -n "$helper" ]]; then
        "$helper" -S --noconfirm ungoogled-chromium
    else
        local tmp; tmp=$(mktemp -d)
        git clone https://github.com/ungoogled-software/ungoogled-chromium-archlinux "$tmp"
        cd "$tmp"
        git checkout "$(git describe --abbrev=0 --tags)"
        makepkg -s --noconfirm
        sudo pacman -U ungoogled-chromium-*.pkg.tar.zst --noconfirm
        cd - > /dev/null && rm -rf "$tmp"
    fi
    ok "Done (source build)."
}

main() {
    echo -e "\n${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   ungoogled-chromium — Arch Installer    ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}\n"
    echo "  1) cachy-repo    — CachyOS native, fastest (recommended for you)"
    echo "  2) Chaotic-AUR   — pre-built binary, adds Chaotic repo to pacman"
    echo "  3) AUR -bin      — pre-compiled, no extra repo"
    echo "  4) AUR source    — compile from scratch (1–3 hrs)"
    echo ""
    read -rp "Select method [1/2/3/4]: " choice
    case "$choice" in
        1) install_cachy_repo ;;
        2) install_chaotic_aur ;;
        3) install_aur_bin ;;
        4) install_aur_source ;;
        *) die "Invalid choice." ;;
    esac
}

main "$@"
