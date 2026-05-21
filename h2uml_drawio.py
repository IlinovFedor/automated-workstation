#!/usr/bin/env python3
"""
Convert C++ .h headers into draw.io UML class diagrams.

Usage:
  python3 h2uml_drawio.py <input_path> [--root <project_root>]

Input can be a single .h file or a directory. Output .drawio files
are written next to the input headers.
"""

from __future__ import annotations

import argparse
import html
import os
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import xml.etree.ElementTree as ET


SWIMLANE_STYLE = (
    "swimlane;fontStyle=1;align=center;verticalAlign=top;"
    "childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;"
    "resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;"
    "marginBottom=0;whiteSpace=wrap;html=1;"
)
TEXT_STYLE = (
    "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;"
    "spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;"
    "points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;"
)
LINE_STYLE = (
    "line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;"
    "spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;"
    "labelPosition=right;points=[];portConstraint=eastwest;strokeColor=inherit;"
)
DEPENDENCY_STYLE = "endArrow=open;endSize=12;dashed=1;html=1;rounded=0;"
INHERIT_STYLE = "endArrow=block;endFill=0;html=1;rounded=0;"


@dataclass
class Param:
    type: str
    name: Optional[str]


@dataclass
class Method:
    name: str
    return_type: Optional[str]
    params: List[Param]
    access: str
    is_constructor: bool = False
    is_destructor: bool = False
    is_friend: bool = False
    order: int = 0


@dataclass
class Field:
    name: str
    type: str
    access: str


@dataclass
class FriendFunction:
    name: str
    return_type: str
    params: List[Param]
    owner_class: str


@dataclass
class ClassDef:
    name: str
    kind: str
    bases: List[str] = field(default_factory=list)
    fields: List[Field] = field(default_factory=list)
    methods: List[Method] = field(default_factory=list)
    friends: List[FriendFunction] = field(default_factory=list)


@dataclass
class ClassBox:
    name: str
    fields: List[str]
    methods: List[str]
    width: int
    height: int
    x: int = 0
    y: int = 0
    is_stub: bool = False
    id_box: Optional[str] = None
    id_fields: Optional[str] = None
    id_methods: Optional[str] = None


def strip_comments(text: str) -> str:
    out = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == '"':
            j = i + 1
            while j < len(text):
                if text[j] == '"' and text[j - 1] != '\\':
                    j += 1
                    break
                j += 1
            out.append(text[i:j])
            i = j
            continue
        if ch == "'":
            j = i + 1
            while j < len(text):
                if text[j] == "'" and text[j - 1] != '\\':
                    j += 1
                    break
                j += 1
            out.append(text[i:j])
            i = j
            continue
        if text.startswith("//", i):
            j = text.find("\n", i)
            i = len(text) if j == -1 else j
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = len(text) if j == -1 else j + 2
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def find_matching_brace(text: str, start: int) -> int:
    depth = 0
    i = start
    while i < len(text):
        ch = text[i]
        if ch in ('"', "'"):
            q = ch
            i += 1
            while i < len(text) and text[i] != q:
                if text[i] == '\\':
                    i += 1
                i += 1
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def split_members(body: str) -> List[str]:
    members = []
    start = 0
    i = 0
    paren = 0
    brace = 0
    angle = 0
    in_str: Optional[str] = None
    while i < len(body):
        ch = body[i]
        if in_str:
            if ch == in_str and body[i - 1] != '\\':
                in_str = None
            i += 1
            continue
        if ch in ('"', "'"):
            in_str = ch
            i += 1
            continue
        if ch == '(':
            paren += 1
        elif ch == ')':
            paren = max(0, paren - 1)
        elif ch == '<':
            angle += 1
        elif ch == '>':
            angle = max(0, angle - 1)
        elif ch == '{':
            brace += 1
        elif ch == '}':
            brace = max(0, brace - 1)
            if brace == 0 and paren == 0:
                decl = body[start:i + 1].strip()
                if decl:
                    members.append(decl)
                start = i + 1
        elif ch == ';' and paren == 0 and brace == 0 and angle == 0:
            decl = body[start:i + 1].strip()
            if decl:
                members.append(decl)
            start = i + 1
        i += 1
    tail = body[start:].strip()
    if tail:
        members.append(tail)
    return members


def split_params(text: str) -> List[str]:
    parts = []
    start = 0
    depth = 0
    angle = 0
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth = max(0, depth - 1)
        elif ch == '<':
            angle += 1
        elif ch == '>':
            angle = max(0, angle - 1)
        elif ch == ',' and depth == 0 and angle == 0:
            parts.append(text[start:i].strip())
            start = i + 1
        i += 1
    last = text[start:].strip()
    if last:
        parts.append(last)
    return parts


def parse_param(text: str) -> Param:
    txt = text.strip()
    if not txt or txt == 'void':
        return Param("", None)
    if '=' in txt:
        txt = txt.split('=', 1)[0].strip()
    txt = re.sub(r'\s*&\s*([A-Za-z_][A-Za-z0-9_]*)\s*$', r' &\1', txt)
    txt = re.sub(r'\s*\*\s*([A-Za-z_][A-Za-z0-9_]*)\s*$', r' *\1', txt)
    m = re.search(r'([A-Za-z_][A-Za-z0-9_]*)\s*$', txt)
    if not m:
        return Param(txt.strip(), None)
    name = m.group(1)
    type_part = txt[:m.start(1)].strip()
    if not type_part:
        return Param(txt.strip(), None)
    if type_part.endswith("::"):
        return Param(txt.strip(), None)
    if type_part.endswith("<") or type_part.endswith(","):
        return Param(txt.strip(), None)
    # If type ends with pointer/reference, attach to type and keep name
    if type_part.endswith("&") or type_part.endswith("*"):
        ref = type_part[-1]
        base = type_part[:-1].strip()
        if base:
            return Param(f"{base} {ref}", name)
        return Param(txt.strip(), None)
    # If token looks like a type (std::string), keep full text as type-only
    if "::" in txt:
        return Param(txt.strip(), None)
    return Param(type_part, name)


def parse_method_signature(sig: str, class_name: str) -> Optional[Tuple[str, Optional[str], List[Param], bool, bool]]:
    text = sig.strip().rstrip(';')
    text = re.sub(r'\b(friend|inline|virtual|static|constexpr)\b', '', text).strip()
    text = re.sub(r'\s+', ' ', text)
    if '(' not in text:
        return None
    pre, rest = text.split('(', 1)
    params_str, _ = split_paren_tail(rest)
    pre = pre.strip()
    params = []
    for p in split_params(params_str):
        if p:
            param = parse_param(p)
            if param.type or param.name:
                params.append(param)
    if 'operator' in pre:
        idx = pre.find('operator')
        ret = pre[:idx].strip() or None
        name = pre[idx:].strip()
    else:
        parts = pre.split()
        if not parts:
            return None
        name = parts[-1]
        ret = ' '.join(parts[:-1]).strip() or None
    is_ctor = name == class_name
    is_dtor = name == f"~{class_name}"
    if is_ctor or is_dtor:
        ret = None
    return name, ret, params, is_ctor, is_dtor


def split_paren_tail(rest: str) -> Tuple[str, str]:
    depth = 1
    i = 0
    while i < len(rest):
        ch = rest[i]
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return rest[:i], rest[i + 1:]
        i += 1
    return rest, ""


def parse_class_body(body: str, class_name: str, default_access: str) -> Tuple[List[Field], List[Method], List[FriendFunction]]:
    fields: List[Field] = []
    methods: List[Method] = []
    friends: List[FriendFunction] = []
    access = default_access
    order = 0
    for decl in split_members(body):
        d = decl.strip().rstrip(';').strip()
        if not d:
            continue
        if d in ("public:", "private:", "protected:"):
            access = d[:-1]
            continue
        if d.startswith("public:"):
            access = "public"
            d = d[len("public:"):].strip()
        elif d.startswith("private:"):
            access = "private"
            d = d[len("private:"):].strip()
        elif d.startswith("protected:"):
            access = "protected"
            d = d[len("protected:"):].strip()
        if not d:
            continue
        if d.startswith("friend "):
            for extra in d.split(";"):
                extra = extra.strip()
                if not extra:
                    continue
                if extra.startswith("friend "):
                    extra = extra[len("friend "):].strip()
                msig = parse_method_signature(extra, class_name)
                if msig:
                    name, ret, params, _, _ = msig
                    if ret:
                        friends.append(FriendFunction(name=name, return_type=ret, params=params, owner_class=class_name))
            continue
        msig = parse_method_signature(d, class_name)
        if msig:
            name, ret, params, is_ctor, is_dtor = msig
            methods.append(Method(
                name=name,
                return_type=ret,
                params=params,
                access=access,
                is_constructor=is_ctor,
                is_destructor=is_dtor,
                order=order,
            ))
            order += 1
            continue
        fields.extend(parse_fields(d, access))
    return fields, methods, friends


def parse_fields(text: str, access: str) -> List[Field]:
    if '(' in text:
        return []
    work = text
    if '=' in work:
        work = work.split('=', 1)[0].strip()
    parts = [p.strip() for p in work.split(',') if p.strip()]
    if not parts:
        return []
    out: List[Field] = []
    base_type, name = split_type_and_name(parts[0])
    if base_type and name:
        out.append(Field(name=name, type=base_type, access=access))
    for part in parts[1:]:
        t, n = split_type_and_name(part)
        if not n:
            continue
        t = (base_type + " " + t).strip() if t else base_type
        out.append(Field(name=n, type=t, access=access))
    return out


def split_type_and_name(part: str) -> Tuple[str, Optional[str]]:
    m = re.search(r'([A-Za-z_][A-Za-z0-9_]*)\s*$', part)
    if not m:
        return part.strip(), None
    name = m.group(1)
    type_part = part[:m.start(1)].strip()
    if type_part.endswith("::"):
        return part.strip(), None
    return type_part, name


def parse_classes(text: str) -> List[ClassDef]:
    cleaned = strip_comments(text)
    # strip template parameter lists to avoid false class matches
    cleaned = re.sub(r'template\s*<[^>]*>', ' ', cleaned)
    classes: List[ClassDef] = []
    i = 0
    pattern = re.compile(r'\b(class|struct)\s+(\w+)')

    brace_depth = 0
    angle_depth = 0
    in_str: Optional[str] = None

    while i < len(cleaned):
        ch = cleaned[i]
        if in_str:
            if ch == in_str and cleaned[i - 1] != '\\':
                in_str = None
            i += 1
            continue
        if ch in ('"', "'"):
            in_str = ch
            i += 1
            continue
        if ch == '{':
            brace_depth += 1
        elif ch == '}':
            brace_depth = max(0, brace_depth - 1)
        elif ch == '<':
            angle_depth += 1
        elif ch == '>':
            angle_depth = max(0, angle_depth - 1)

        m = pattern.match(cleaned, i)
        if m and brace_depth == 0 and angle_depth == 0:
            kind = m.group(1)
            name = m.group(2)
            brace = cleaned.find('{', m.end())
            semi = cleaned.find(';', m.end())
            if semi != -1 and (brace == -1 or semi < brace):
                i = semi + 1
                continue
            if brace == -1:
                i = m.end()
                continue
            header = cleaned[m.end():brace]
            bases = []
            if ':' in header:
                _, base_part = header.split(':', 1)
                for b in base_part.split(','):
                    b = b.strip()
                    if not b:
                        continue
                    b = re.sub(r'\b(public|private|protected|virtual)\b', '', b).strip()
                    if b:
                        bases.append(b)
            end = find_matching_brace(cleaned, brace)
            if end == -1:
                i = brace + 1
                continue
            body = cleaned[brace + 1:end]
            default_access = "private" if kind == "class" else "public"
            fields, methods, friends = parse_class_body(body, name, default_access)
            classes.append(ClassDef(name=name, kind=kind, bases=bases, fields=fields, methods=methods, friends=friends))
            i = end + 1
            brace_depth = 0
            angle_depth = 0
            continue

        i += 1
    return classes


def visibility_sign(access: str) -> str:
    return {'public': '+', 'private': '-', 'protected': '#'}.get(access, '-')


def acronym_from_camel(text: str) -> str:
    if not text:
        return ""
    chars = [c for c in text if c.isupper()]
    if not chars:
        return text[0].lower()
    return ''.join(chars).lower()


def base_type_name(t: str) -> str:
    t = t.replace("const", "").replace("&", " ").replace("*", " ")
    t = re.sub(r'\s+', ' ', t).strip()
    if t.endswith(" const"):
        t = t[:-6].strip()
    if '::' in t:
        t = t.split('::')[-1]
    if '<' in t:
        t = t.split('<', 1)[0].strip()
    return t


def normalize_type_name(t: str) -> str:
    t = t.replace("const", "")
    t = t.replace("&", " ").replace("*", " ")
    t = re.sub(r'\s+', ' ', t).strip()
    if t.endswith(" const"):
        t = t[:-6].strip()
    return t


def normalize_type_display(t: str) -> str:
    if not t:
        return ""
    text = t.strip()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\b(\w+)\s+const\b', r'const \1', text)
    text = re.sub(r'\s*&\s*', ' &', text)
    text = re.sub(r'\s*\*\s*', ' *', text)
    text = re.sub(r'\s+&', ' &', text)
    text = re.sub(r'\s+\*', ' *', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def normalize_class_type(t: str) -> str:
    text = t.strip()
    text = re.sub(r'\bconst\b', '', text)
    text = text.replace('&', ' ').replace('*', ' ')
    text = re.sub(r'\b(class|struct)\b', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def fill_param_names(method: Method, fields: List[Field]) -> None:
    missing = [p for p in method.params if not p.name and p.type]
    if not missing:
        return
    if method.is_constructor and len(method.params) == 2:
        names = [f.name.lower() for f in fields]
        if "first" in names and "second" in names:
            for idx, p in enumerate(method.params):
                if not p.name:
                    p.name = "f" if idx == 0 else "s"
            return
    if method.is_constructor and len(method.params) == len(fields) and fields:
        for p, f in zip(method.params, fields):
            if not p.name:
                p.name = f.name
        return
    if method.is_constructor and len(method.params) == 1:
        p = method.params[0]
        if p.type and (method.name in p.type or base_type_name(p.type) == method.name):
            if not p.name:
                p.name = "p"
                return
    if method.name == "init" and len(method.params) == len(fields) and fields:
        for p, f in zip(method.params, fields):
            if not p.name:
                p.name = f.name
        return
    if method.name.startswith("set") and len(method.params) == 1:
        suffix = method.name[3:]
        if suffix:
            method.params[0].name = acronym_from_camel(suffix)
            return
    if method.name.startswith("operator"):
        for p in method.params:
            if not p.name:
                bt = base_type_name(p.type)
                p.name = bt[:1].lower() if bt else "arg"
        return
    if "element" in method.name or "index" in method.name:
        if len(method.params) == 1:
            method.params[0].name = "num"
            return
    for idx, p in enumerate(method.params, 1):
        if not p.name:
            p.name = f"arg{idx}"


def format_params(params: List[Param]) -> str:
    parts = []
    for p in params:
        if not p.type and not p.name:
            continue
        ptype = normalize_type_display(p.type)
        if p.name:
            pname = p.name.strip()
            if pname.startswith('&') or pname.startswith('*'):
                pname = pname[1:].strip()
            if ptype.endswith('&') or ptype.endswith('*'):
                parts.append(f"{pname} : {ptype}")
            else:
                parts.append(f"{pname} : {ptype}")
        else:
            parts.append(ptype)
    return ", ".join(parts)


def method_to_line(method: Method) -> str:
    vis = visibility_sign(method.access)
    if method.is_constructor or method.is_destructor:
        return f"{vis} {method.name}({format_params(method.params)})".rstrip()
    ret = normalize_type_display(method.return_type or "void")
    return f"{vis} {method.name}({format_params(method.params)}) : {ret}".rstrip()


def friend_to_line(friend: FriendFunction) -> str:
    params = format_params(friend.params)
    return f"+ {friend.name}({params}) {friend.return_type}".rstrip()


def build_class_box(cdef: ClassDef) -> ClassBox:
    fields_lines = [f"{visibility_sign(f.access)} {f.name} : {normalize_type_display(f.type)}" for f in cdef.fields]
    methods = order_methods(cdef)
    methods_lines = [method_to_line(m) for m in methods]
    if not fields_lines:
        fields_lines = [". . ."]
    if not methods_lines:
        methods_lines = [". . ."]
    width = calc_width(len(fields_lines), len(methods_lines))
    height = calc_height(len(fields_lines), len(methods_lines))
    return ClassBox(name=cdef.name, fields=fields_lines, methods=methods_lines, width=width, height=height)


def build_stub_box(name: str, friend_lines: Optional[List[str]] = None) -> ClassBox:
    fields_lines = [". . ."]
    methods_lines = [". . ."]
    if friend_lines:
        methods_lines = [". . .", "<br>"] + friend_lines + ["<br>"]
    width = calc_width(len(fields_lines), len(methods_lines))
    height = calc_height(len(fields_lines), len(methods_lines))
    return ClassBox(name=name, fields=fields_lines, methods=methods_lines, width=width, height=height, is_stub=True)


def calc_width(fields_count: int, methods_count: int) -> int:
    total = fields_count + methods_count
    if total <= 7:
        return 220
    if total <= 16:
        return 380
    return 520


def method_line_height(count: int) -> Tuple[int, int]:
    if count <= 6:
        return 20, 2
    return 16, 0


def calc_height(fields_count: int, methods_count: int) -> int:
    fields_h = fields_count * 20 + 4
    m_h, m_pad = method_line_height(methods_count)
    methods_h = methods_count * m_h + m_pad
    total = 26 + fields_h + 8 + methods_h
    min_total = 140 if (fields_count + methods_count) <= 6 else 0
    if methods_count >= 11:
        min_total = 290
    return max(total, min_total)


def make_div_lines(lines: List[str]) -> str:
    out = []
    for line in lines:
        if line == "<br>":
            out.append("<div><br></div>")
        else:
            val = html.escape(line)
            out.append(f"<div>{val}</div>")
    return "".join(out)


def normalize_field_key(name: str) -> str:
    return re.sub(r'[^a-z0-9]', '', name.lower())


def adjust_accessor_types(methods: List[Method], fields: List[Field]) -> None:
    if not fields:
        return
    field_map = {normalize_field_key(f.name): f for f in fields}
    for m in methods:
        if m.name.startswith("get") and not m.is_constructor and not m.is_destructor:
            key = normalize_field_key(m.name[3:])
            f = field_map.get(key)
            if f:
                m.return_type = f.type
        if m.name.startswith("set") and len(m.params) == 1:
            key = normalize_field_key(m.name[3:])
            f = field_map.get(key)
            if f:
                m.params[0].type = f.type


def order_methods(cdef: ClassDef) -> List[Method]:
    access_priority = {"private": 0, "protected": 1, "public": 2}
    field_order = {normalize_field_key(f.name): idx for idx, f in enumerate(cdef.fields)}

    def is_getter_setter(m: Method) -> Optional[Tuple[int, int]]:
        if m.name.startswith("get"):
            key = normalize_field_key(m.name[3:])
            if key in field_order:
                return (field_order[key], 0)
            return (1000 + m.order, 0)
        if m.name.startswith("set"):
            key = normalize_field_key(m.name[3:])
            if key in field_order:
                return (field_order[key], 1)
            return (1000 + m.order, 1)
        return None

    def operator_rank(m: Method) -> int:
        if m.name == "operator=":
            return 90
        if not m.name.startswith("operator+"):
            return 100
        if not m.params:
            return 50
        t = base_type_name(m.params[0].type)
        if t in ("int", "double", "float", "char", "bool"):
            return 0
        return 10

    adjusted = list(cdef.methods)
    for m in adjusted:
        if m.is_constructor and len(m.params) == 1:
            p = m.params[0]
            if p.type and base_type_name(p.type) == cdef.name and "const" not in p.type:
                p.type = "const " + p.type.strip()
    adjust_accessor_types(adjusted, cdef.fields)
    ordered: List[Method] = []
    for access in ("private", "protected", "public"):
        items = [m for m in adjusted if m.access == access]
        ctors = [m for m in items if m.is_constructor or m.is_destructor]
        rest = [m for m in items if m not in ctors]
        getters_setters = [m for m in rest if is_getter_setter(m)]
        others = [m for m in rest if m not in getters_setters]
        getters_setters.sort(key=lambda m: (is_getter_setter(m)[0], is_getter_setter(m)[1]))
        others.sort(key=lambda m: (operator_rank(m), m.order))
        ctors.sort(key=lambda m: m.order)
        ordered.extend(ctors + getters_setters + others)
    return ordered


def layout_boxes(boxes: List[ClassBox], columns: int, start_x: int, start_y: int, gap_x: int, gap_y: int) -> None:
    if not boxes:
        return
    columns = max(1, columns)
    rows = (len(boxes) + columns - 1) // columns
    col_widths = [0] * columns
    row_heights = [0] * rows
    for idx, box in enumerate(boxes):
        r = idx // columns
        c = idx % columns
        col_widths[c] = max(col_widths[c], box.width)
        row_heights[r] = max(row_heights[r], box.height)
    for idx, box in enumerate(boxes):
        r = idx // columns
        c = idx % columns
        x = start_x + sum(col_widths[:c]) + gap_x * c
        y = start_y + sum(row_heights[:r]) + gap_y * r
        box.x = x
        box.y = y


def build_drawio(boxes: List[ClassBox], edges: List[Tuple[str, str, str, str]]) -> str:
    mxfile = ET.Element("mxfile", host="app.diagrams.net", scale="1", border="0")
    diagram = ET.SubElement(mxfile, "diagram", name="Page-1", id="diagram-1")
    mx = ET.SubElement(
        diagram,
        "mxGraphModel",
        dx="1156",
        dy="838",
        grid="1",
        gridSize="10",
        guides="1",
        tooltips="1",
        connect="1",
        arrows="1",
        fold="1",
        page="1",
        pageScale="1",
        pageWidth="850",
        pageHeight="1100",
        math="0",
        shadow="0",
    )
    root = ET.SubElement(mx, "root")
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    id_counter = 2
    def uid() -> str:
        nonlocal id_counter
        id_counter += 1
        return f"c{id_counter}"

    box_map: Dict[str, ClassBox] = {}
    for box in boxes:
        box_id = uid()
        box.id_box = box_id
        box_map[box.name] = box
        cell = ET.SubElement(root, "mxCell", id=box_id, parent="1", style=SWIMLANE_STYLE, value=box.name, vertex="1")
        ET.SubElement(cell, "mxGeometry", width=str(box.width), height=str(box.height), x=str(box.x), y=str(box.y), **{"as": "geometry"})

        fields_id = uid()
        box.id_fields = fields_id
        fields = ET.SubElement(root, "mxCell", id=fields_id, parent=box_id, style=TEXT_STYLE, value=make_div_lines(box.fields), vertex="1")
        fields_h = len(box.fields) * 20 + 4
        ET.SubElement(fields, "mxGeometry", width=str(box.width), height=str(fields_h), y="26", **{"as": "geometry"})

        line_id = uid()
        line = ET.SubElement(root, "mxCell", id=line_id, parent=box_id, style=LINE_STYLE, value="", vertex="1")
        ET.SubElement(line, "mxGeometry", width=str(box.width), height="8", y=str(26 + fields_h), **{"as": "geometry"})

        methods_id = uid()
        box.id_methods = methods_id
        methods = ET.SubElement(root, "mxCell", id=methods_id, parent=box_id, style=TEXT_STYLE, value=make_div_lines(box.methods), vertex="1")
        m_h, m_pad = method_line_height(len(box.methods))
        methods_h = len(box.methods) * m_h + m_pad
        ET.SubElement(methods, "mxGeometry", width=str(box.width), height=str(methods_h), y=str(26 + fields_h + 8), **{"as": "geometry"})

    for src_name, tgt_name, style, src_port in edges:
        src_box = box_map.get(src_name)
        tgt_box = box_map.get(tgt_name)
        if not src_box or not tgt_box:
            continue
        if src_port == "methods":
            src_id = src_box.id_methods
        else:
            src_id = src_box.id_box
        if not src_id or not tgt_box.id_box:
            continue
        edge_id = uid()
        edge = ET.SubElement(root, "mxCell", id=edge_id, edge="1", parent="1", source=src_id, target=tgt_box.id_box, style=style, value="")
        ET.SubElement(edge, "mxGeometry", relative="1", **{"as": "geometry"})

    xml = ET.tostring(mxfile, encoding="unicode")
    return xml


def collect_headers(path: str) -> List[str]:
    exts = ('.h', '.hpp', '.hh', '.hxx')
    if os.path.isfile(path) and path.endswith(exts):
        return [path]
    headers = []
    for root, _, files in os.walk(path):
        for f in files:
            if f.endswith(exts):
                headers.append(os.path.join(root, f))
    return headers


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert C++ headers to draw.io UML class diagrams")
    parser.add_argument("input", help=".h file or directory")
    parser.add_argument("--root", default=None, help="project root for type resolution")
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    root = os.path.abspath(args.root) if args.root else (input_path if os.path.isdir(input_path) else os.path.dirname(input_path))

    all_headers = collect_headers(root)
    class_index: Dict[str, ClassDef] = {}
    file_classes: Dict[str, List[ClassDef]] = {}
    for h in all_headers:
        try:
            text = open(h, "r", encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        classes = parse_classes(text)
        file_classes[h] = classes
        for c in classes:
            class_index[c.name] = c

    targets = collect_headers(input_path)
    if not targets:
        raise SystemExit("No .h files found")

    for h in targets:
        classes = file_classes.get(h, [])
        if not classes:
            continue
        boxes: List[ClassBox] = []
        edges: List[Tuple[str, str, str, str]] = []

        friend_map: Dict[str, List[str]] = {}
        for c in classes:
            for m in c.methods:
                fill_param_names(m, c.fields)
            for fr in c.friends:
                for p in fr.params:
                    if not p.name:
                        bt = base_type_name(p.type)
                        p.name = bt[:1].lower() if bt else "arg"
                # attach to first param type if available
                if fr.params:
                    ext_type = normalize_class_type(fr.params[0].type)
                    friend_map.setdefault(ext_type, []).append(friend_to_line(fr))

        for c in classes:
            boxes.append(build_class_box(c))

        for ext_type, lines in friend_map.items():
            if ext_type in class_index:
                continue
            boxes.append(build_stub_box(ext_type, lines))

        # include base classes from project
        for c in classes:
            for b in c.bases:
                b_name = b.strip()
                if b_name in class_index and b_name not in [bx.name for bx in boxes]:
                    boxes.append(build_class_box(class_index[b_name]))

        internal = [b for b in boxes if not b.is_stub]
        external = [b for b in boxes if b.is_stub]

        layout_boxes(internal, columns=2 if len(internal) > 1 else 1, start_x=200, start_y=300, gap_x=80, gap_y=120)
        max_y = 0
        for b in internal:
            max_y = max(max_y, b.y + b.height)
        layout_boxes(external, columns=2 if len(external) > 1 else 1, start_x=90, start_y=max_y + 140, gap_x=60, gap_y=100)

        # edges
        box_by_name = {b.name: b for b in boxes}
        for c in classes:
            box = box_by_name.get(c.name)
            if not box:
                continue
            for fr in c.friends:
                if not fr.params:
                    continue
                ext_type = normalize_class_type(fr.params[0].type)
                target = box_by_name.get(ext_type)
                if target:
                    edges.append((box.name, target.name, DEPENDENCY_STYLE, "methods"))
        for c in classes:
            box = box_by_name.get(c.name)
            if not box:
                continue
            for b in c.bases:
                base_box = box_by_name.get(b.strip())
                if base_box:
                    edges.append((box.name, base_box.name, INHERIT_STYLE, "box"))

        xml = build_drawio(boxes, edges)
        out_path = os.path.splitext(h)[0] + ".drawio"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(xml)


if __name__ == "__main__":
    main()
