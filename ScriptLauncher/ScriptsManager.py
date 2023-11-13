# Fusion360API Python Addin

import pathlib
import traceback
import adsk.core as core
import re
from dataclasses import dataclass
import pathlib

TREE_PATTERNS = [
    ["Number", "^[\d+]"],
    ["A", "^[a]"],
    ["B", "^[b]"],
    ["C", "^[c]"],
    ["D", "^[d]"],
    ["E", "^[e]"],
    ["F", "^[f]"],
    ["G", "^[g]"],
    ["H", "^[h]"],
    ["I", "^[i]"],
    ["J", "^[j]"],
    ["K", "^[k]"],
    ["L", "^[l]"],
    ["M", "^[m]"],
    ["N", "^[n]"],
    ["O", "^[o]"],
    ["P", "^[p]"],
    ["Q", "^[q]"],
    ["R", "^[r]"],
    ["S", "^[s]"],
    ["T", "^[t]"],
    ["U", "^[u]"],
    ["V", "^[v]"],
    ["W", "^[w]"],
    ["X", "^[x]"],
    ["Y", "^[y]"],
    ["Z", "^[z]"],
]

ICON_MAP = {
    core.ProgrammingLanguages.PythonProgrammingLanguage: "resources/python.png",
    core.ProgrammingLanguages.CPPProgramminglanguage: "resources/cpp.png",
}

@dataclass
class ScriptContainer:
    id: int
    script: core.Script
    installFolders: list[str]

    def __post_init__(self):
        isInstallMark = "☆" if self._is_installation_script() else ""
        self.name = f"{isInstallMark}{self.script.name}"        
        self.icon = ICON_MAP[self.script.programmingLanguage]
        self.tooltip = self.script.description


    def toJson(self):
        return {
            "id": self.id,
            "text": self.name,
            "icon": self.icon,
            "a_attr": {"title": self.tooltip},
        }


    def _is_installation_script(self) -> bool:
        return get_parent_folder(self.script) in self.installFolders


    def exec(self):
        try:
            self.script.run()
        except:
            core.Application.get().log(
                "Failed:\n{}".format(traceback.format_exc())
            )


class ScriptsManager():
    def __init__(self) -> None:
        self.installationFolders = self._get_installation_folders()
        self.items: list = self._get_scripts()


    def _get_scripts(self):
        app: core.Application = core.Application.get()
        scripts = [s for s in app.scripts if not s.isAddIn]

        script: core.Script = None
        lst: list = []
        for idx, script in enumerate(scripts):

            if not script.isVisible:
                print(f"{script.name}")
                continue

            lst.append(
                ScriptContainer(
                    idx,
                    script,
                    self.installationFolders,
                )
            )

        return lst


    def _get_installation_folders(self) -> list[str]:
        app: core.Application = core.Application.get()

        return [get_parent_folder(s) for s in app.scripts
                if s.name == "SpurGear"]


    def _group_by(self, scripts: list) -> dict:
        # sort
        items = sorted(scripts, key=lambda x: x.script.name.lower())

        otherKey = ["other", "other"]

        group = {key[0]: [] for key in TREE_PATTERNS}
        group[otherKey[0]] = []

        for item in items:
            name = item.script.name
            hitFg = False
            for pattern in TREE_PATTERNS:
                match = re.search(pattern[1], name.lower())
                if match:
                    group[pattern[0]].append(item)
                    hitFg = True
                    break
            if not hitFg:
                group[otherKey[0]].append(item)

        return group


    def get_jstree_json(self) -> list:
        groups = self._group_by(self.items)
        treeContent = []
        groupCount = len(self.items)
        for key in groups:
            if len(groups[key]) < 1:
                continue

            children = [item.toJson() for item in groups[key]]
            treeContent.append(
                {
                    "id": groupCount,
                    "text": key,
                    "children": children,
                }
            )
            groupCount += 1

        return treeContent


    def get_item_by_id(self, id: int) -> core.Script:
        for item in self.items:
            if item.id == id:
                return item.script

        return core.Script.cast(None)


def get_parent_folder(script: core.Script) -> str:
    return str(pathlib.Path(script.folder).parent)