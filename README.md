# kubePill

A floating `kubectl` cheat sheet that lives on your desktop. It sits on your screen as a small terminal pill — start typing and it expands with matching commands, each with a man-page style explainer and copy-paste examples.

No browser. No Electron. No internet. **~1 MB.**

```
  ● ● ●   ~ $ kubectl ▮                          ●  ▾  ×
```

---
<img width="527" height="104" alt="image" src="https://github.com/user-attachments/assets/72a8487a-5b43-47d3-bc47-04da4f55c529" />
<img width="609" height="381" alt="image" src="https://github.com/user-attachments/assets/ae347a49-3792-4526-a252-5a9744a1db98" />
<img width="619" height="656" alt="image" src="https://github.com/user-attachments/assets/945c0a86-a72f-48e1-bf3d-e812e54888b1" />



## Why

Because the commands you actually forget aren't `get pods` — they're `-o jsonpath='{.items[*].metadata.name}'` and `kubectl debug --target=`. Alt-tabbing to a browser to look those up breaks flow. kubePill stays pinned next to your terminal and answers in one keystroke.

## Features

- **The pill is the prompt.** Type `logs` and it expands mid-keystroke with live-filtered results.
- **31 commands across 6 categories** — pods, debug, deploy, cluster, output & filtering, advanced.
- **Man-page modals.** Click any command for NAME / DESCRIPTION / EXAMPLES. Click any example to copy it.
- **Pin on top.** Keep it hovering over your terminal while you work.
- **Fully offline.** No telemetry, no network calls, no accounts.
- **Tiny.** ~1 MB, because it uses your OS's built-in webview instead of shipping a browser.

## Install

### Download a release (recommended)

Grab the latest build for your platform from the [**Releases**](../../releases/latest) page:

| Platform | File |
|---|---|
| Windows | `kubepill-windows-x64.zip` |
| macOS (Apple Silicon) | `kubepill-macos-arm64.zip` |
| macOS (Intel) | `kubepill-macos-x64.zip` |
| Linux | `kubepill-linux-x64.zip` |

Unzip anywhere and run the executable. **Keep `resources.neu` in the same folder** — that file *is* the app.

<details>
<summary><b>Windows:</b> "Windows protected your PC" warning</summary>

SmartScreen flags unsigned apps. Click **More info** → **Run anyway**. Code signing certificates cost a few hundred dollars a year, which is hard to justify for a free cheat sheet — the source is right here if you'd rather build it yourself.
</details>

<details>
<summary><b>macOS:</b> "kubepill cannot be opened because the developer cannot be verified"</summary>

Same story — unsigned. Either right-click the app → **Open** → **Open**, or run:

```bash
xattr -d com.apple.quarantine ./kubepill-mac_arm64
chmod +x ./kubepill-mac_arm64
```
</details>

<details>
<summary><b>Linux:</b> make it executable</summary>

```bash
chmod +x ./kubepill-linux_x64
./kubepill-linux_x64
```

Requires `libwebkit2gtk-4.1` (usually already installed):
```bash
# Debian / Ubuntu
sudo apt install libwebkit2gtk-4.1-0
# Fedora
sudo dnf install webkit2gtk4.1
```
</details>

### Build from source

Requires [Node.js](https://nodejs.org) 18+.

```bash
git clone https://github.com/ronnienelson/kubepill.git
cd kubepill
npm install
npx neu update      # fetches the Neutralino runtime + client library
npm run dev         # run it
npm run build       # build binaries for all platforms into dist/
```

## Usage

| Action | How |
|---|---|
| Search | Just start typing — the pill *is* the input |
| Expand / collapse | `▾` button, or double-click the drag area |
| Focus search | `/` |
| Clear search | `Esc` |
| Collapse to pill | `Esc` again |
| Move it | Drag by the dots or the `~ $ kubectl` text |
| Pin on top | `●` button (turns yellow when pinned) |
| Copy an example | Click it |
| Quit | `×` |

`Esc` walks backwards through state: close modal → clear search → collapse to pill.

## Adding your own commands

Command data is plain JSON — you don't need to touch any code. Edit [`src/commands.json`](src/commands.json):

```json
{
  "name": "helm",
  "color": "#83a598",
  "commands": [
    {
      "cmd": "helm upgrade",
      "short": "install or upgrade a release",
      "desc": "Upgrades a release to a new chart version, or installs it if it doesn't exist yet with --install.",
      "examples": [
        { "command": "helm upgrade --install api ./chart", "note": "idempotent deploy" },
        { "command": "helm upgrade api ./chart --atomic", "note": "roll back automatically on failure" }
      ]
    }
  ]
}
```

Each category needs a `name`, a `color` (hex), and a list of `commands`. Each command needs `cmd`, `short`, `desc`, and at least one example. Re-run `npm run dev` to see it.

Colors used by the built-in categories come from the [gruvbox](https://github.com/morhetz/gruvbox) palette.

## How it works

kubePill is a [Neutralino](https://neutralino.js.org) app: plain HTML/CSS/JS rendered by the webview your OS already ships (WebView2 on Windows, WebKit on macOS/Linux). That's why it's ~1 MB instead of the ~200 MB an equivalent Electron app would be.

The interesting part is the resize dance in [`src/app.js`](src/app.js) — expanding grows the OS window *before* revealing content, collapsing hides content *before* shrinking the window. Do it in the wrong order and the widget renders malformed mid-transition.

```
src/
├── index.html      # markup shell
├── styles.css      # gruvbox terminal theme
├── app.js          # widget logic + window control
├── commands.json   # ← the data. edit this.
└── icons/
```

## Contributing

PRs welcome — especially new commands and categories. See [CONTRIBUTING.md](CONTRIBUTING.md).

Good first contributions:
- Commands you personally always have to look up
- A Helm / k9s / kustomize category
- Light theme support

## License

[MIT](LICENSE) — do whatever you like with it.

## Acknowledgements

- [Neutralino](https://neutralino.js.org) for the runtime
- [gruvbox](https://github.com/morhetz/gruvbox) by morhetz for the palette
- The official [kubectl cheat sheet](https://kubernetes.io/docs/reference/kubectl/quick-reference/) — still the canonical reference
