# Fusion360API Python Addin
import adsk.core as core
import traceback
import json
import os
import sys
import subprocess
from .ScriptsManager import ScriptsManager

handlers = []
_app: core.Application = None
_ui: core.UserInterface = None
_palette_visible = False
_is_stopping = False
_workspace_handlers = []
_palette_geometry = None

_cmdInfo = {
    "id": "kantoku_ScriptLauncher",
    "name": "Script Launcher",
    "tooltip": "This is an experimental and simplified script menu.",
    "resources": "resources",
    "panelIds": ("SolidScriptsAddinsPanel", "CAMScriptsAddinsPanel")
}

# アドインパネルを持たないワークスペースへの追加設定
_extraWorkspaceIds = (
    "FusionRenderEnvironment",          # レンダリング
    "FusionDocumentationEnvironment",   # 図面
)
_TAB_ID = "kantoku_ToolsTab"
_PANEL_ID = "kantoku_SolidScriptsAddinsPanel"
_addinsPanelCmdIds = (
    "ScriptsManagerCommand",    # スクリプトとアドイン
    "ExchangeAppStoreCommand",  # Fusion App Store
)
_extraPanels = []

_paletteInfo = {
    "id": "ScriptPalette",
    "name": _cmdInfo["name"],
    "htmlFileURL": "html/index.html",
    "isVisible": True,
    "showCloseButton": True,
    "isResizable": True,
    "isOpaque": False,
    "width": 400,
    "height": 300,
    "useNewWebBrowser": True,
    "dockingState": None
}


class MyHTMLEventHandler(core.HTMLEventHandler):
    """パレットの HTML イベントを処理するハンドラ。

    htmlLoaded 時にスクリプト一覧を jsTree 形式で返し、
    execScript 時に指定スクリプトを実行する。
    """

    def __init__(self):
        super().__init__()
        self.treeJson = None
        self.scriptsMgr = None

    def notify(self, args):
        """HTML イベントを受け取り、アクションに応じて処理する。"""
        try:
            htmlArgs = core.HTMLEventArgs.cast(args)

            global _app
            if htmlArgs.action == "htmlLoaded":
                self.scriptsMgr = ScriptsManager()
                jstreeJson = self.scriptsMgr.get_jstree_json()
                args.returnData = json.dumps(
                    {
                        "action": "send",
                        "data": jstreeJson,
                    }
                )

            elif htmlArgs.action == "execScript":
                if not self.scriptsMgr:
                    return
                data = json.loads(htmlArgs.data)
                idStr = str(data.get("id", ""))
                if not idStr.isdigit():
                    return
                script: core.Script = self.scriptsMgr.get_item_by_id(int(idStr))
                if script:
                    script.run()

            elif htmlArgs.action == "openFolder":
                if not self.scriptsMgr:
                    return
                data = json.loads(htmlArgs.data)
                idStr = str(data.get("id", ""))
                if not idStr.isdigit():
                    return
                script: core.Script = self.scriptsMgr.get_item_by_id(int(idStr))
                if not script:
                    return
                folder = script.folder
                if not os.path.isdir(folder):
                    return
                if sys.platform == "win32":
                    os.startfile(folder)
                else:
                    subprocess.Popen(["open", folder])

        except:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def initPallet(keepIfVisible=False):
    """パレットを初期化して表示する。既存パレットがある場合は削除してから再生成する。

    keepIfVisible が True で、既存パレットが有効かつ表示中の場合は何もしない。
    """
    global _ui, _paletteInfo

    palette: core.palette = _ui.palettes.itemById(_paletteInfo["id"])
    if keepIfVisible and palette and palette.isValid and palette.isVisible:
        return
    if palette and palette.isValid:
        palette.deleteMe()

    palette = _ui.palettes.addTransparent(
        _paletteInfo["id"],
        _paletteInfo["name"],
        _paletteInfo["htmlFileURL"],
        _paletteInfo["isVisible"],
        _paletteInfo["showCloseButton"],
        _paletteInfo["isResizable"],
        _paletteInfo["isOpaque"],
        _paletteInfo["width"],
        _paletteInfo["height"],
    )

    if _palette_geometry:
        try:
            geo = _palette_geometry
            if geo["dockingState"] != core.PaletteDockingStates.PaletteDockStateFloating:
                palette.dockingState = geo["dockingState"]
            else:
                palette.setPosition(geo["left"], geo["top"])
                palette.setSize(geo["width"], geo["height"])
        except:
            _app.log("Failed to restore palette geometry:\n{}".format(
                traceback.format_exc()))
            palette.setPosition(800, 400)
    elif _paletteInfo["dockingState"]:
        palette.dockingState = _paletteInfo["dockingState"]
    else:
        palette.setPosition(800, 400)

    onHTMLEvent = MyHTMLEventHandler()
    palette.incomingFromHTML.add(onHTMLEvent)
    handlers.append(onHTMLEvent)

    onClosed = MyCloseEventHandler()
    palette.closed.add(onClosed)
    handlers.append(onClosed)


class ShowPaletteCommandExecuteHandler(core.CommandEventHandler):
    """パレット表示コマンドの実行ハンドラ。"""

    def __init__(self):
        super().__init__()

    def notify(self, args):
        """コマンド実行時にパレットを初期化・表示する。"""
        try:
            global _palette_visible
            _palette_visible = True
            initPallet()
        except:
            _ui.messageBox("Command executed failed: {}".format(
                traceback.format_exc()))


class MyCloseEventHandler(core.UserInterfaceGeneralEventHandler):
    """パレットのクローズイベントハンドラ。"""

    def __init__(self):
        super().__init__()

    def notify(self, args):
        """パレットが閉じられたときの処理。"""
        try:
            global _palette_visible
            if _is_stopping:
                return
            _palette_visible = False
        except:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


class MyWorkspacePreDeactivateHandler(core.WorkspaceEventHandler):
    """ワークスペース切替直前にパレットの位置・サイズを記録するハンドラ。"""

    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            global _palette_geometry
            palette = _ui.palettes.itemById(_paletteInfo["id"])
            if palette and palette.isValid and palette.isVisible:
                _palette_geometry = {
                    "left": palette.left,
                    "top": palette.top,
                    "width": palette.width,
                    "height": palette.height,
                    "dockingState": palette.dockingState,
                }
        except:
            core.Application.get().log(
                "Failed:\n{}".format(traceback.format_exc()))


class MyWorkspaceActivatedHandler(core.WorkspaceEventHandler):
    """ワークスペース切替後、Fusion に破棄されたパレットを再作成するハンドラ。"""

    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            if _palette_visible and not _is_stopping:
                initPallet(keepIfVisible=True)
        except:
            core.Application.get().log(
                "Failed:\n{}".format(traceback.format_exc()))


class ShowPaletteCommandCreatedHandler(core.CommandCreatedEventHandler):
    """パレット表示コマンドの生成ハンドラ。実行ハンドラを登録する。"""

    def __init__(self):
        super().__init__()

    def notify(self, args):
        """コマンド生成時に実行ハンドラをコマンドへ登録する。"""
        try:
            command = args.command
            onExecute = ShowPaletteCommandExecuteHandler()
            command.execute.add(onExecute)
            handlers.append(onExecute)
        except:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def find_utilities_tab(ws: core.Workspace, name: str) -> core.ToolbarTab:
    """ワークスペースの標準ユーティリティタブを名前で探す。自前(kantoku_)は除く。"""
    for tab in ws.toolbarTabs:
        if tab.id.startswith("kantoku_"):
            continue
        if tab.name == name:
            return tab
    return None


def add_to_extra_workspaces(cmdDef: core.CommandDefinition):
    """レンダリング・図面のユーティリティタブにアドインパネルを用意し、
    標準のアドインパネルのコマンドと本コマンドを追加する。

    ユーティリティタブが無ければ生成し、タブ内にアドインパネルが無ければ生成する。
    """
    refTab = _ui.toolbarTabsByProductType(
        "DesignProductType").itemById("ToolsTab")
    refPanel = refTab.toolbarPanels.itemById(
        "SolidScriptsAddinsPanel") if refTab else None
    tabName = refTab.name if refTab else "Utilities"
    panelName = refPanel.name if refPanel else "Add-Ins"

    # 追加するコマンド（標準アドインパネルのコマンド + 本コマンド）
    cmdDefs = []
    for cmdId in _addinsPanelCmdIds:
        d = _ui.commandDefinitions.itemById(cmdId)
        if d:
            cmdDefs.append(d)
    cmdDefs.append(cmdDef)

    for wsId in _extraWorkspaceIds:
        ws: core.Workspace = _ui.workspaces.itemById(wsId)
        if not ws:
            continue

        # ユーティリティタブ（標準 → 自前 → 生成）
        tab: core.ToolbarTab = find_utilities_tab(ws, tabName)
        if not tab:
            tab = ws.toolbarTabs.itemById(_TAB_ID)
        if not tab:
            tab = ws.toolbarTabs.add(_TAB_ID, tabName)

        # アドインパネル（既存 → 生成）
        panel: core.ToolbarPanel = None
        for p in tab.toolbarPanels:
            if p.id == _PANEL_ID or p.name == panelName:
                panel = p
                break
        if not panel:
            panel = tab.toolbarPanels.add(_PANEL_ID, panelName)

        _app.log("ScriptLauncher: {} -> {} / {}".format(
            wsId, tab.id, panel.id))

        added = []
        for d in cmdDefs:
            if panel.controls.itemById(d.id):
                continue
            panel.controls.addCommand(d)
            added.append(d.id)
        _extraPanels.append((panel, tab, added))


def remove_from_extra_workspaces():
    """追加したコマンドを削除し、空になった自前のパネル・タブを削除する。"""
    for panel, tab, added in _extraPanels:
        try:
            if not panel.isValid:
                continue
            for cmdId in added:
                cntrl = panel.controls.itemById(cmdId)
                if cntrl:
                    cntrl.deleteMe()

            # 他アドインのボタンが残っている場合や標準のものは削除しない
            if panel.id == _PANEL_ID and panel.controls.count == 0:
                panel.deleteMe()
            if tab.isValid and tab.id == _TAB_ID \
                    and tab.toolbarPanels.count == 0:
                tab.deleteMe()
        except:
            _app.log("Failed:\n{}".format(traceback.format_exc()))
    _extraPanels.clear()


def run(context):
    """アドイン起動時の処理。コマンドボタンをツールバーパネルに追加する。"""
    try:
        global _ui, _app, _is_stopping, _palette_visible
        _is_stopping = False
        _palette_visible = False
        _app = core.Application.get()
        _ui = _app.userInterface

        global _cmdInfo
        showPaletteCmdDef = _ui.commandDefinitions.itemById(_cmdInfo["id"])
        if showPaletteCmdDef:
            showPaletteCmdDef.deleteMe()

        showPaletteCmdDef = _ui.commandDefinitions.addButtonDefinition(
            _cmdInfo["id"],
            _cmdInfo["name"],
            _cmdInfo["tooltip"],
            _cmdInfo["resources"]
        )

        global handlers
        onCommandCreated = ShowPaletteCommandCreatedHandler()
        showPaletteCmdDef.commandCreated.add(onCommandCreated)
        handlers.append(onCommandCreated)

        for panelId in _cmdInfo["panelIds"]:
            panel = _ui.allToolbarPanels.itemById(panelId)
            if not panel:
                continue
            cntrl = panel.controls.itemById(_cmdInfo["id"])
            if not cntrl:
                panel.controls.addCommand(showPaletteCmdDef)

        # レンダリング・図面のアドインパネルに追加する
        add_to_extra_workspaces(showPaletteCmdDef)

        # ワークスペース切替で破棄されたパレットを再作成する
        onPreDeactivate = MyWorkspacePreDeactivateHandler()
        _ui.workspacePreDeactivate.add(onPreDeactivate)
        _workspace_handlers.append((_ui.workspacePreDeactivate, onPreDeactivate))

        onActivated = MyWorkspaceActivatedHandler()
        _ui.workspaceActivated.add(onActivated)
        _workspace_handlers.append((_ui.workspaceActivated, onActivated))
    except:
        if _ui:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def stop(context):
    """アドイン停止時の処理。パレットとコマンドボタンを削除する。"""
    global _is_stopping
    _is_stopping = True
    for event, handler in _workspace_handlers:
        try:
            event.remove(handler)
        except:
            pass
    _workspace_handlers.clear()

    try:
        global _paletteInfo
        palette = _ui.palettes.itemById(_paletteInfo["id"])
        if palette:
            palette.deleteMe()

        global _cmdInfo
        for panelId in _cmdInfo["panelIds"]:
            panel = _ui.allToolbarPanels.itemById(panelId)
            if not panel:
                continue
            cmd = panel.controls.itemById(_cmdInfo["id"])
            if cmd:
                cmd.deleteMe()

        remove_from_extra_workspaces()

        cmdDef =_ui.commandDefinitions.itemById(_cmdInfo["id"])
        if cmdDef:
            cmdDef.deleteMe()

        _app.log("Stop addin")
    except:
        if _ui:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))
