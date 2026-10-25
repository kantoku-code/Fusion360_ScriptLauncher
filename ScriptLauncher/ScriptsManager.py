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
    """Fusion 360 スクリプト1件を保持するコンテナ。jsTree 表示に必要な情報を提供する。"""

    id: int
    script: core.Script
    installFolders: list[str]

    def __post_init__(self):
        """初期化後処理。表示名・アイコン・ツールチップを設定する。"""
        isInstallMark = "☆" if self._is_installation_script() else ""
        self.name = f"{isInstallMark}{self.script.name}"
        self.icon = ICON_MAP.get(self.script.programmingLanguage, "resources/python.png")
        self.tooltip = self.script.description

    def toJson(self) -> dict:
        """jsTree ノード用の辞書を返す。"""
        return {
            "id": self.id,
            "text": self.name,
            "icon": self.icon,
            "a_attr": {"title": self.tooltip},
        }

    def _is_installation_script(self) -> bool:
        """SpurGear と同じフォルダにある場合、インストール済みスクリプトとみなす。"""
        return get_parent_folder(self.script) in self.installFolders

    def exec(self):
        """スクリプトを実行する。失敗した場合はログに記録する。"""
        try:
            self.script.run()
        except:
            core.Application.get().log(
                "Failed:\n{}".format(traceback.format_exc())
            )


class ScriptsManager():
    """Fusion 360 のスクリプト一覧を管理し、jsTree 向けデータを提供するクラス。"""

    def __init__(self) -> None:
        """インストールフォルダとスクリプト一覧を初期化する。"""
        self.installationFolders = self._get_installation_folders()
        self.items: list = self._get_scripts()

    def _get_scripts(self) -> list:
        """表示対象のスクリプトを ScriptContainer のリストとして返す。アドインは除外する。"""
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
        """SpurGear スクリプトの親フォルダをインストールフォルダとして返す。"""
        app: core.Application = core.Application.get()

        return [get_parent_folder(s) for s in app.scripts
                if s.name == "SpurGear"]

    def _group_by(self, scripts: list) -> dict:
        """スクリプトを名前の頭文字でグループ化して返す。"""
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
        """jsTree 用のツリーデータ（グループ＋子ノード）をリストで返す。"""
        groups = self._group_by(self.items)
        treeContent = []
        for key in groups:
            if len(groups[key]) < 1:
                continue

            children = [item.toJson() for item in groups[key]]
            treeContent.append(
                {
                    "id": f"group_{key}",
                    "text": key,
                    "children": children,
                }
            )

        return treeContent

    def get_item_by_id(self, id: int) -> core.Script:
        """ID に対応する Script オブジェクトを返す。見つからない場合は None を返す。"""
        for item in self.items:
            if item.id == id:
                return item.script

        return core.Script.cast(None)


def get_parent_folder(script: core.Script) -> str:
    """スクリプトフォルダの親ディレクトリパスを文字列で返す。"""
    return str(pathlib.Path(script.folder).parent)
