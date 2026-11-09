# ***Autodesk Fusion ScriptLauncher***
This is an add-in for the Autodesk software Fusion360.

A tree-like menu to simplify the sequential execution of scripts.

---

## **Installation**:

1. Quit Autodesk Fusion.
2. Download and extract the zip file.
3. Run `installer\install_Win.cmd` in the extracted folder.
4. Follow the on-screen instructions and enter `Y`.
5. The "ScriptLauncher" folder is copied to `%APPDATA%\Autodesk\Autodesk Fusion 360\API\AddIns\ScriptLauncher`.

To uninstall, delete the copied "ScriptLauncher" folder.

---
## **usage method**:

- After launching the add-in, the "Script Launcher" command will be added in "Utilities" - "Add-Ins".

![Alt text](./resources/menu_eng.png)

- After executing the command, a dialog box will appear, displaying a menu divided into a tree with numbers, each letter of the alphabet, and others.

  - Scripts marked with ☆ are installed by default.

![Alt text](./resources/dialog_eng.png)

- The scripts that will be registered in the menu are all the scripts listed in the "Scripts" tab of the "Scripts and Add-Ins" menu.

![Alt text](./resources/member_eng.png)

- Double-clicking on any script executes the corresponding script.

- Right-clicking on a script and selecting "フォルダオープン" (Open Folder) opens the folder of that script.

---

## **Features**:

- **Supported workspaces**
  - The command is added to the "Utilities" - "Add-Ins" panel in both the "Design" and "Manufacture (CAM)" workspaces.
  - In the "Render" and "Drawing" workspaces, an "Add-Ins" panel is added to the "Utilities" tab (the tab is created if it does not exist), and this command, "Scripts and Add-Ins" and "Fusion App Store" are added to it.

- **Tree grouping rules**
  - Scripts are grouped by the first character of their name (case-insensitive).
    - Names starting with a digit → "Number"
    - Names starting with A-Z → the group for that letter
    - Anything else (e.g. Japanese names or symbols) → "other"
  - Scripts within a group are sorted alphabetically.
  - Groups with no scripts are not shown.

- **Display**
  - Python scripts and C++ scripts are shown with their own icons.
  - Hovering the mouse cursor over a script shows its description as a tooltip.
  - The ☆ mark is added to the sample scripts bundled with Fusion360 (those in the same folder as "SpurGear").

- **Not shown**
  - Add-ins
  - Scripts set to hidden

- **Refreshing the list**
  - The script list is loaded when the command is executed and the palette opens.
  - If you add or remove scripts while the palette is open, run the command again to get the latest list.

---

## **Environment**:

The following environment is confirmed.

- Autodesk Fusion Ver2706.1.17
- Windows11 64bit Home

---

## **License**:
- Apache License 2.0

---
---

# *** 以下は日本語です。***

このアドインは、Fusion360用アドインです。

スクリプトの連続実行を簡素化する為のツリー状のメニューです。

---

## **インストール**:
1. Fusion を終了します。
2. zip ファイルをダウンロードし、展開します。
3. 展開したフォルダ内の `installer\install_Win.cmd` を実行します。
4. 画面の指示に従い、`Y` を入力します。
5. "ScriptLauncher" フォルダが `%APPDATA%\Autodesk\Autodesk Fusion 360\API\AddIns\ScriptLauncher` にコピーされます。

アンインストールはコピーされた "ScriptLauncher" フォルダを削除してください。

---
## **使用法**:

- アドイン起動後は、"ユーティリティ" - "アドイン" 内に "Script Launcher" コマンドが追加されます。

![Alt text](./resources/menu_jpn.png)

- コマンド実行後はダイアログが表示され、数字・各アルファベット・その他でツリー分けされたメニューが表示されます。

  - ☆印はデフォルトでインストールされているスクリプトです。

![Alt text](./resources/dialog_jpn.png)

- メニューに登録されるスクリプトは、"スクリプトとアドイン"の"スクリプト"タブで表示されている全てのスクリプトです。

![Alt text](./resources/member_jpn.png)

- 任意のスクリプトをダブルクリックする事で、該当するスクリプトが実行されます。

- スクリプトを右クリックして "フォルダオープン" を選ぶと、該当するスクリプトのフォルダが開きます。

---

## **機能**:

- **対応ワークスペース**
  - "デザイン" と "製造(CAM)" の両方の "ユーティリティ" - "アドイン" パネルにコマンドが追加されます。
  - "レンダリング" と "図面" では、"ユーティリティ" タブ（無い場合は作成）に "アドイン" パネルを追加し、本コマンドと "スクリプトとアドイン"・"Fusion App Store" を登録します。

- **ツリーの分類ルール**
  - スクリプト名の先頭文字でグループ分けします（大文字・小文字は区別しません）。
    - 数字で始まるもの → "Number"
    - A～Z で始まるもの → 各アルファベットのグループ
    - それ以外（日本語名・記号など）→ "other"
  - グループ内は名前のアルファベット順に並びます。
  - スクリプトが1つもないグループは表示されません。

- **表示内容**
  - Python スクリプトと C++ スクリプトは、それぞれ専用のアイコンで表示されます。
  - スクリプトにマウスカーソルを合わせると、スクリプトの説明（description）がツールチップで表示されます。
  - ☆印は、Fusion360 に標準で入っているサンプルスクリプト（"SpurGear" と同じフォルダにあるもの）に付きます。

- **表示されないもの**
  - アドイン
  - 非表示に設定されているスクリプト

- **一覧の更新**
  - スクリプトの一覧は、コマンドを実行してパレットを開いたときに読み込まれます。
  - パレットを開いている間にスクリプトを追加・削除した場合は、もう一度コマンドを実行すると最新の一覧になります。

---

## **動作環境**:
- Autodesk Fusion Ver2706.1.17

- Windows11 64bit Home

---

## **ライセンス**:
- Apache License 2.0

---

## **謝辞** :

- [日本語フォーラム](https://forums.autodesk.com/t5/fusion-360-ri-ben-yu/bd-p/707)の皆さん、ありがとう。
