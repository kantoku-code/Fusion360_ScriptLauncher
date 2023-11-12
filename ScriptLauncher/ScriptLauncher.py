# Fusion360API Python Addin
import adsk.core as core
# import adsk.fusion as fusion
import traceback
import json
from .ScriptsManager import ScriptsManager

handlers = []
_app: core.Application = None
_ui: core.UserInterface = None

_cmdInfo = {
    "id": "kantoku_ScriptLauncher",
    "name": "Script Launcher",
    "tooltip": "This is an experimental and simplified script menu.",
    "resources": ""
}

_paletteInfo = {
    "id": "ScriptPalette",
    "name": _cmdInfo["name"],
    "htmlFileURL": "index.html",
    "isVisible": True,
    "showCloseButton": True,
    "isResizable": True,
    "width": 400,
    "height": 300,
    "useNewWebBrowser": True,
    "dockingState": None
}


class MyHTMLEventHandler(core.HTMLEventHandler):
    def __init__(self):
        super().__init__()
        self.treeJson = None
        self.scriptsMgr = None

    def notify(self, args):
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
                data = json.loads(htmlArgs.data)
                script: core.Script = self.scriptsMgr.get_item_by_id(int(data["id"]))
                if script:
                    script.run()

        except:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def initPallet():
    global _ui, _paletteInfo

    palette = _ui.palettes.itemById(_paletteInfo["id"])
    if palette:
        palette.deleteMe()

    palette = _ui.palettes.add(
        _paletteInfo["id"],
        _paletteInfo["name"],
        _paletteInfo["htmlFileURL"],
        _paletteInfo["isVisible"],
        _paletteInfo["showCloseButton"],
        _paletteInfo["isResizable"],
        _paletteInfo["width"],
        _paletteInfo["height"],
        _paletteInfo["useNewWebBrowser"],
    )

    if _paletteInfo["dockingState"]:
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
    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            initPallet()
        except:
            _ui.messageBox("Command executed failed: {}".format(
                traceback.format_exc()))


class MyCloseEventHandler(core.UserInterfaceGeneralEventHandler):
    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            pass
        except:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


class ShowPaletteCommandCreatedHandler(core.CommandCreatedEventHandler):
    def __init__(self):
        super().__init__()

    def notify(self, args):
        try:
            command = args.command
            onExecute = ShowPaletteCommandExecuteHandler()
            command.execute.add(onExecute)
            handlers.append(onExecute)
        except:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def run(context):
    try:
        global _ui, _app
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

        panel = _ui.allToolbarPanels.itemById("SolidScriptsAddinsPanel")
        cntrl = panel.controls.itemById("showPalette")
        if not cntrl:
            panel.controls.addCommand(showPaletteCmdDef)
    except:
        if _ui:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))


def stop(context):
    try:
        global _paletteInfo
        palette = _ui.palettes.itemById(_paletteInfo["id"])
        if palette:
            palette.deleteMe()

        global _cmdInfo
        panel = _ui.allToolbarPanels.itemById("SolidScriptsAddinsPanel")
        cmd = panel.controls.itemById(_cmdInfo["id"])
        if cmd:
            cmd.deleteMe()
        cmdDef = _ui.commandDefinitions.itemById(_cmdInfo["id"])
        if cmdDef:
            cmdDef.deleteMe()

        _app.log("Stop addin")
    except:
        if _ui:
            _ui.messageBox("Failed:\n{}".format(traceback.format_exc()))
