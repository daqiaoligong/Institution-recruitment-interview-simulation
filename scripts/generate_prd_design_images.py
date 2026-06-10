from pathlib import Path
import math
import textwrap

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "design_outputs"
OUT.mkdir(exist_ok=True)

W, H = 1440, 900
BG = (247, 248, 250)
INK = (18, 24, 38)
MUTED = (105, 112, 128)
LINE = (224, 228, 235)
SOFT = (255, 255, 255)
ORANGE = (255, 122, 24)
BLUE = (44, 94, 190)
GREEN = (39, 174, 96)


def font(size, bold=False):
    names = [
        "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf" if bold else "C:/Windows/Fonts/simsun.ttc",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


F12, F14, F16, F18, F20, F24, F28, F34, F42 = [font(s) for s in [12, 14, 16, 18, 20, 24, 28, 34, 42]]
FB14, FB16, FB18, FB22, FB24, FB28, FB38 = [font(s, True) for s in [14, 16, 18, 22, 24, 28, 38]]


def rr(draw, box, r=18, fill=SOFT, outline=None, width=1):
    draw.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)


def shadowed_card(img, box, r=24, fill=SOFT, outline=(236, 239, 244), shadow=True):
    if shadow:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle(box, r, fill=(0, 0, 0, 34))
        layer = layer.filter(ImageFilter.GaussianBlur(18))
        img.alpha_composite(layer, (0, 8))
    d = ImageDraw.Draw(img)
    rr(d, box, r, fill, outline)


def text(draw, xy, s, f=F16, fill=INK, anchor=None, align="left"):
    draw.text(xy, s, font=f, fill=fill, anchor=anchor, align=align)


def line(draw, xy, fill=LINE, width=1):
    draw.line(xy, fill=fill, width=width)


def paste_fit(base, path, box, cover=True, radius=0, opacity=255):
    img = Image.open(path).convert("RGBA")
    bw, bh = box[2] - box[0], box[3] - box[1]
    iw, ih = img.size
    scale = max(bw / iw, bh / ih) if cover else min(bw / iw, bh / ih)
    resized = img.resize((int(iw * scale), int(ih * scale)), Image.LANCZOS)
    x = (resized.width - bw) // 2
    y = (resized.height - bh) // 2
    cropped = resized.crop((x, y, x + bw, y + bh))
    if opacity < 255:
        cropped.putalpha(cropped.getchannel("A").point(lambda p: p * opacity // 255))
    if radius:
        mask = Image.new("L", (bw, bh), 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle((0, 0, bw, bh), radius, fill=255)
        cropped.putalpha(Image.composite(cropped.getchannel("A"), Image.new("L", (bw, bh), 0), mask))
        base.alpha_composite(cropped, (box[0], box[1]))
    else:
        base.alpha_composite(cropped, (box[0], box[1]))


def wrap(draw, s, max_w, f):
    lines = []
    buf = ""
    for ch in s:
        test = buf + ch
        if draw.textlength(test, font=f) <= max_w:
            buf = test
        else:
            if buf:
                lines.append(buf)
            buf = ch
    if buf:
        lines.append(buf)
    return lines


def button(draw, box, label, primary=False, icon=None, subtle=False):
    fill = INK if primary else ((246, 247, 249) if subtle else SOFT)
    outline = None if primary else LINE
    rr(draw, box, 18, fill, outline)
    color = SOFT if primary else INK
    if icon:
        cx, cy = box[0] + 26, (box[1] + box[3]) // 2
        if icon == "▶":
            draw.polygon([(cx - 4, cy - 9), (cx - 4, cy + 9), (cx + 10, cy)], fill=color)
        elif icon == "→":
            draw.line((cx - 8, cy, cx + 9, cy), fill=color, width=2)
            draw.line((cx + 3, cy - 6, cx + 9, cy, cx + 3, cy + 6), fill=color, width=2)
        elif icon == "✦":
            draw.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill=color)
        else:
            text(draw, (cx, cy), icon, F18, color, "mm")
        text(draw, ((box[0] + box[2]) // 2 + 12, (box[1] + box[3]) // 2), label, FB16, color, "mm")
    else:
        text(draw, ((box[0] + box[2]) // 2, (box[1] + box[3]) // 2), label, FB16, color, "mm")


def nav(img, active="面试模拟"):
    d = ImageDraw.Draw(img)
    rr(d, (44, 30, W - 44, 98), 26, (255, 255, 255, 232), (235, 238, 243))
    paste_fit(img, ASSETS / "logo.png", (66, 42, 112, 88), cover=True, radius=12)
    paste_fit(img, ASSETS / "name.png", (122, 46, 314, 84), cover=False)
    tabs = ["面试模拟", "题库", "岗位信息"]
    x = 950
    for t in tabs:
        w = 98 if t != "岗位信息" else 116
        is_on = t == active
        rr(d, (x, 48, x + w, 82), 17, (18, 24, 38) if is_on else (247, 248, 250), None if is_on else LINE)
        text(d, (x + w / 2, 65), t, F14, SOFT if is_on else INK, "mm")
        x += w + 14
    rr(d, (1300, 47, 1338, 85), 19, (255, 247, 239), (255, 198, 160))
    text(d, (1319, 66), "我", FB16, ORANGE, "mm")


def base(active="面试模拟"):
    img = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(img)
    for y in range(135, H, 32):
        line(d, (0, y, W, y), (242, 244, 247), 1)
    for x in range(0, W, 32):
        line(d, (x, 120, x, H), (242, 244, 247), 1)
    nav(img, active)
    return img


def hero_title(d, title, subtitle, y=150):
    text(d, (W // 2, y), title, FB38, INK, "mm")
    text(d, (W // 2, y + 42), subtitle, F18, MUTED, "mm")


def draw_input(d, box, label, value=None):
    text(d, (box[0], box[1] - 24), label, FB14, (75, 84, 99))
    rr(d, box, 16, SOFT, LINE)
    if value:
        text(d, (box[0] + 18, (box[1] + box[3]) // 2), value, F16, INK, "lm")


def page1():
    img = base("面试模拟")
    d = ImageDraw.Draw(img)
    hero_title(d, "上海事业单位面试模拟", "听题、看题、录音转写与 AI 复盘的一体化练习空间")
    paste_fit(img, ASSETS / "logo.png", (558, 245, 882, 565), cover=False)
    button(d, (565, 620, 875, 680), "开始面试", True, "▶")
    text(d, (720, 735), "极简流程 · 真实考场 · 本地记录", F16, MUTED, "mm")
    return img


def page2():
    img = base("面试模拟")
    d = ImageDraw.Draw(img)
    hero_title(d, "开始前设置", "选择套题、答题时间和面试形式")
    shadowed_card(img, (460, 255, 980, 650), 30)
    draw_input(d, (510, 310, 930, 368), "选择题目", "2025年上海静安区事业单位面试真题")
    draw_input(d, (510, 420, 930, 478), "每道题面试时间", "4 分钟 / 题")
    draw_input(d, (510, 530, 930, 588), "面试形式", "听题模式")
    button(d, (510, 610, 930, 666), "开始面试", True, "▶")
    return img


def draw_sim_widgets(d, mode="听题模式", collapsed=False, mode_fill=SOFT, record_fill=SOFT):
    rr(d, (1214, 38, 1332, 78), 18, (255, 255, 255, 218), None)
    text(d, (1234, 52), "倒计时", F12, MUTED)
    text(d, (1288, 59), "11:42", FB18, INK, "mm")
    text(d, (70, 64), mode, FB22, mode_fill)
    rr(d, (788, 807, 904, 853), 23, (18, 24, 38, 238), None)
    text(d, (846, 830), "下一题", FB14, SOFT, "mm")
    rr(d, (610, 802, 662, 854), 26, (255, 255, 255, 222), None)
    text(d, (636, 828), "●", F24, ORANGE, "mm")
    text(d, (636, 872), "录音中", F12, record_fill, "mm")
    rr(d, (682, 806, 730, 854), 24, (255, 255, 255, 222), None)
    d.polygon([(699, 817), (699, 842), (718, 829)], fill=INK)
    rr(d, (748, 806, 772, 854), 12, (255, 255, 255, 222), None)
    d.rectangle((755, 821, 760, 838), fill=INK)
    d.rectangle((763, 821, 768, 838), fill=INK)
    rr(d, (930, 806, 978, 854), 24, (255, 255, 255, 222), None)
    d.arc((943, 818, 965, 840), 35, 330, fill=INK, width=3)
    d.polygon([(965, 814), (971, 824), (958, 824)], fill=INK)
    if collapsed:
        rr(d, (665, 858, 775, 890), 16, (255, 255, 255, 218), None)
        text(d, (720, 874), "显示题目", FB14, INK, "mm")


def sim_base(mode="听题模式", collapsed=False):
    img = Image.new("RGBA", (W, H), (12, 14, 18, 255))
    paste_fit(img, ASSETS / "面试背景图.png", (0, 0, W, H), cover=True)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, W, H), fill=(0, 0, 0, 42))
    for i in range(150):
        alpha = int(6 + i * 0.8)
        od.line((0, H - 150 + i, W, H - 150 + i), fill=(248, 249, 251, alpha), width=1)
    img.alpha_composite(overlay)
    d = ImageDraw.Draw(img)
    draw_sim_widgets(d, mode, collapsed)
    return img


def page3():
    img = sim_base("听题模式")
    return img


def page4():
    img = Image.new("RGBA", (W, H), (248, 249, 251, 255))
    d = ImageDraw.Draw(img)
    rr(d, (120, 112, 1320, 760), 34, SOFT, (235, 238, 243))
    d.line((706, 154, 720, 168, 734, 154), fill=INK, width=4)
    qs = [
        "题目 1：上海推进社区15分钟生活圈建设，部分社区配置不均，你怎么看？",
        "题目 2：单位要组织廉政主题宣讲活动，领导交给你负责，你如何开展？",
        "题目 3：群众反映线上办事流程复杂，老年人不会操作，你会如何调研并改进？",
    ]
    y = 230
    for i, q in enumerate(qs, 1):
        rr(d, (230, y, 1210, y + 88), 20, (248, 249, 251), LINE)
        text(d, (260, y + 44), f"{i}", FB18, ORANGE, "mm")
        text(d, (305, y + 44), q, F18, INK, "lm")
        y += 120
    draw_sim_widgets(d, "看题模式", False, mode_fill=INK, record_fill=MUTED)
    return img


def page5():
    img = sim_base("看题模式", True)
    return img


def page6():
    img = base("面试模拟")
    d = ImageDraw.Draw(img)
    text(d, (92, 145), "面试结束复盘", FB38, INK)
    text(d, (92, 190), "逐题查看录音、转写文本、AI评语与答题思路", F18, MUTED)
    x1, y = 92, 255
    for i in range(1, 4):
        shadowed_card(img, (x1, y, 805, y + 150), 22)
        text(d, (125, y + 28), f"第 {i} 题", FB18, INK)
        text(d, (125, y + 62), "上海事业单位真实面试题目摘要展示...", F16, MUTED)
        rr(d, (125, y + 100, 320, y + 130), 15, (247, 248, 250), LINE)
        text(d, (142, y + 115), "▶ 录音 02:48", F14, INK, "lm")
        text(d, (340, y + 115), "转写文本：回答能围绕问题展开，结构较清晰。", F14, MUTED, "lm")
        y += 175
    shadowed_card(img, (860, 245, 1336, 420), 24)
    text(d, (900, 285), "AI 评语", FB22, INK)
    for i, s in enumerate(["观点明确，能结合上海基层治理场景。", "建议补充数据案例，提高说服力。", "结尾可强化岗位匹配与服务意识。"]):
        text(d, (900, 328 + i * 28), "• " + s, F16, MUTED)
    shadowed_card(img, (860, 455, 1336, 760), 24)
    text(d, (900, 495), "AI 答题思路", FB22, INK)
    points = ["表态：肯定政策目标，指出落地差异。", "分析：居民需求、资源配置、参与机制。", "对策：调研建档、协商共治、动态评估。"]
    for i, s in enumerate(points, 1):
        rr(d, (900, 532 + i * 56, 1296, 574 + i * 56), 16, (248, 249, 251), LINE)
        text(d, (924, 553 + i * 56), f"{i}. {s}", F16, INK, "lm")
    return img


def side_tree(d, x, y, h):
    shadowed_card(current_img, (x, y, x + 255, y + h), 22)
    text(d, (x + 28, y + 34), "题库分类", FB22, INK)
    items = ["套题", "上海市属事业单位", "上海区属事业单位", "综合分析", "人际关系", "应急应变", "组织计划", "岗位匹配题", "我的专属题型"]
    yy = y + 84
    for it in items:
        fill = (255, 247, 239) if it == "上海区属事业单位" else None
        if fill:
            rr(d, (x + 18, yy - 10, x + 237, yy + 30), 14, fill, None)
        text(d, (x + 34, yy + 8), it, FB14 if fill else F14, ORANGE if fill else MUTED, "lm")
        yy += 48


current_img = None


def page7():
    global current_img
    img = base("题库")
    current_img = img
    d = ImageDraw.Draw(img)
    side_tree(d, 64, 135, 700)
    shadowed_card(img, (350, 135, 1030, 835), 22)
    text(d, (390, 178), "2025年上海静安区5月30日面试真题", FB24, INK)
    qs = ["如何看待城市更新中的居民参与不足问题？", "组织一次窗口服务满意度调研，你怎么做？", "群众现场情绪激动投诉办理慢，你如何处理？"]
    y = 235
    for q in qs:
        rr(d, (390, y, 990, y + 112), 20, (248, 249, 251), LINE)
        text(d, (420, y + 28), q, F18, INK)
        button(d, (820, y + 62, 960, y + 98), "加入模拟", False, "+", True)
        y += 145
    shadowed_card(img, (1060, 135, 1360, 682), 22)
    text(d, (1095, 178), "自由组题", FB22, INK)
    for i in range(3):
        rr(d, (1095, 225 + i * 92, 1325, 290 + i * 92), 16, (248, 249, 251), LINE)
        text(d, (1118, 255 + i * 92), f"第 {i+1} 题待编辑", F14, MUTED, "lm")
    button(d, (1095, 720, 1325, 778), "开始模拟", True, "▶")
    return img


def page8():
    global current_img
    img = base("岗位信息")
    current_img = img
    d = ImageDraw.Draw(img)
    side_tree(d, 64, 135, 700)
    shadowed_card(img, (350, 135, 1008, 835), 22)
    text(d, (390, 178), "岗位信息填报", FB24, INK)
    draw_input(d, (390, 245, 958, 305), "岗位名称", "重大项目协调岗")
    draw_input(d, (390, 370, 958, 430), "岗位所在单位", "上海某区事业单位")
    draw_input(d, (390, 495, 958, 590), "岗位要求", "负责跨部门协调、材料撰写、项目推进与群众沟通。")
    draw_input(d, (390, 655, 958, 745), "岗位其他信息", "注重服务意识、执行能力和结构化表达。")
    button(d, (828, 768, 958, 818), "保存", False, None, True)
    shadowed_card(img, (1040, 135, 1360, 682), 22)
    text(d, (1075, 178), "AI 生题展示区", FB22, INK)
    for i in range(4):
        rr(d, (1075, 220 + i * 82, 1325, 275 + i * 82), 16, (248, 249, 251), LINE)
        text(d, (1100, 247 + i * 82), f"岗位匹配题 {i+1}", F14, INK, "lm")
    button(d, (1075, 605, 1325, 655), "加入题库", False, "+", True)
    button(d, (1075, 720, 1325, 778), "AI 生题", True, "✦")
    return img


def page9():
    img = base("面试模拟")
    d = ImageDraw.Draw(img)
    shadowed_card(img, (475, 190, 965, 710), 34)
    paste_fit(img, ASSETS / "logo.png", (655, 225, 785, 355), cover=False)
    text(d, (720, 395), "登录沪面冲鸭", FB28, INK, "mm")
    text(d, (720, 428), "保存你的面试记录与 AI 复盘", F16, MUTED, "mm")
    draw_input(d, (545, 485, 895, 540), "用户名", "考生1234")
    draw_input(d, (545, 585, 895, 640), "邮箱账号", "candidate@example.com")
    button(d, (545, 662, 895, 720), "登录 / 注册", True, "→")
    return img


def page10():
    img = base("面试模拟")
    d = ImageDraw.Draw(img)
    text(d, (120, 155), "个人中心", FB38, INK)
    text(d, (120, 200), "你的每一次模拟都会沉淀为可复盘的记录", F18, MUTED)
    for i, date in enumerate(["2026-06-10 16:35", "2026-06-09 20:18", "2026-06-08 09:42", "2026-06-05 14:06", "2026-06-02 11:25"]):
        y = 260 + i * 105
        shadowed_card(img, (220, y, 1220, y + 76), 22)
        text(d, (260, y + 28), date, FB18, INK)
        text(d, (520, y + 28), "整套三题模拟 · 上海区属事业单位 · 已生成 AI 分析", F16, MUTED)
        rr(d, (1065, y + 18, 1185, y + 58), 18, (248, 249, 251), LINE)
        text(d, (1125, y + 38), "查看", FB14, INK, "mm")
    return img


PAGES = [
    ("01_start_home.png", page1),
    ("02_interview_setup.png", page2),
    ("03_listen_mode.png", page3),
    ("04_read_mode_expanded.png", page4),
    ("05_read_mode_collapsed.png", page5),
    ("06_interview_review.png", page6),
    ("07_question_bank.png", page7),
    ("08_job_info.png", page8),
    ("09_login.png", page9),
    ("10_profile_history.png", page10),
]


if __name__ == "__main__":
    for name, fn in PAGES:
        img = fn().convert("RGB")
        img.save(OUT / name, quality=95)
        print(OUT / name)
