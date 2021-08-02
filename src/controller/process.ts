import { DefaultKoaContext } from "../context";
import xlsx from "node-xlsx";
import * as mime from "mime-types";

interface Row {
    module: string,
    title: string,
    priority: string,
    preCondition: string,
    step: string,
    expect: string,
    remark: string,
    requirement: string,
    testcase: string,
    environment: string
}

function createExcelFile(rows: Row[]) {
    const data: unknown[][] = [
        [`请按照下面的规则填写上传数据:
        1.功能模块：填写用例库下已有的模块名称，请从第一级模块开始完整填写（所有用例不属于模块），层级之间用“/”间隔，例如：一级模块/二级模块/三级模块，最多五级，不填写自动归入至‘无模块用例’中。
        2.标题：必填项，不可为空。
        3.维护人：填写团队成员的姓名或用户名，若团队中有重名的成员默认随机选择其中一位成员。
        4.用例类型：可选值：功能测试、性能测试、配置相关、安装部署、接口测试、安全相关、兼容性测试、UI测试、其他。
        5.重要程度：可选值：P0、P1、P2、P3、P4。
        6.前置条件：选填。
        7.步骤描述：步骤请加编号填写，如1.xxx、2.xxx；每个步骤单元格内换行。
        8.预期结果：预期结果保持编号与步骤对应，如1.xxx、2.xxx；每个预期结果单元格内换行。
        9.关注人：填写团队成员的姓名或用户名，若团队中有重名的成员默认随机选择其中一位成员，填写多个值时，请用"|"隔开。
        10.备注：选填。
        11.自定义属性使用系统中创建的属性名，非必填。
        Tips：
        1.单次导入最多支持1000条。
        2.“标题”为必填项，必填字段为空时，不予以导入。
        `],
        ["功能模块", "*标题", "维护人", "用例类型", "重要程度", "前置条件", "步骤描述", "预期结果", "关注人", "备注", "所属产品", "需求编号", "用例编号", "测试环境"]
    ];

    for (const row of rows) {
        data.push([row.module, row.title, undefined, undefined, row.priority, row.preCondition, row.step, row.expect, undefined, row.remark, undefined, row.requirement, row.testcase, row.environment]);
    }

    const range = { s: { c: 0, r: 0 }, e: { c: 18, r: 0 } };
    const sheetOptions = { '!merges': [range] };
    return xlsx.build([{ name: "test_case", data: data, options: sheetOptions }]);
}

function convertPriority(priority: string) {
    switch (priority) {
        case "A":
            return "P0";
        case "B":
            return "P1";
        case "C":
            return "P2";
        case "D":
            return "P3";
        case "E":
            return "P4";
        default:
            return undefined;
    }
}

function trimBreak(str: string) {
    if (str) {
        str.trim();

        if (str.startsWith("\n")) {
            str = str.substr(1);
        }
        if (str.endsWith("\n")) {
            str = str.substr(0, str.length - 1);
        }
    }
    return str;
}

async function readExcelFile(path: string) {
    const sheets = xlsx.parse(path);
    const result = [];

    for (const sheet of sheets) {
        const data = sheet.data || [];

        let module1: string | undefined;
        let module2: string | undefined;
        let module3: string | undefined;
        let module4: string | undefined;
        let module5: string | undefined;

        for (let index = 1; index < data.length; index++) {
            const row = data[index];

            if (row[0]) {
                module1 = row[0] as string;
                module2 = module3 = module4 = module5 = undefined;
            }
            if (row[1]) {
                module2 = row[1] as string;
                module3 = module4 = module5 = undefined;
            }
            if (row[2]) {
                module3 = row[2] as string;
                module4 = module5 = undefined;
            }
            if (row[3]) {
                module4 = row[3] as string;
                module5 = undefined;
            }
            if (row[4]) {
                module5 = row[4] as string;
            }

            if (row[7] === undefined) {
                continue;
            }

            const newRow: Row = {
                module: [module1, module2, module3, module4, module5].filter(m => m).join("/"),
                title: (row[7] as string).trim(),
                priority: convertPriority(row[11] as string) as string,
                preCondition: row[8] as string,
                step: trimBreak(row[9] as string),
                expect: trimBreak(row[10] as string),
                remark: ``,
                requirement: row[5] as string || "",
                testcase: row[6] as string || "",
                environment: row[12] as string || "",
            };

            result.push(newRow);
        }
    }

    return createExcelFile(result);
}

export default async function renderProcessPage(ctx: DefaultKoaContext) {
    try {
        const file = ctx.request.files!.fileToUpload;

        if (file && !Array.isArray(file)) {
            const { path, name, type } = file;
            const mimetype = mime.extension(type as string);

            ctx.body = await readExcelFile(path);
            ctx.set('Content-disposition', `attachment; filename=${encodeURIComponent("测试用例上传文件")}.xlsx`);
            ctx.set('Content-type', mimetype as string);
        }
        else {
            await ctx.render('error', { message: "错误的文件" })
        }
    }
    catch (error) {
        await ctx.render("error", { error });
    }
}
