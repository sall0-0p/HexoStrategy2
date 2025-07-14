import {ReplicatedStorage} from "@rbxts/services";
import {
    GetTemplateRequest,
    GetTemplateResponse,
    UnitTemplateRequest,
    UnitTemplateResponse
} from "../../../../shared/network/unit/template/Controller";
import {TemplateRepository} from "./TemplateRepository";

const controller = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("Controllers")
    .WaitForChild("TemplateController") as RemoteFunction;

export class TemplateController {
    private static instance: TemplateController;
    private constructor() {
        controller.OnServerInvoke = (plr: Player, ...args: unknown[]) => this.onMessage(plr, args[0] as UnitTemplateRequest);
    }

    private onMessage(plr: Player, msg: UnitTemplateRequest): UnitTemplateResponse {
        switch (msg.type) {
            case "getTemplate":
                return this.getById(msg as GetTemplateRequest);
        }
    }

    private getById(msg: GetTemplateRequest): GetTemplateResponse {
        const repo = TemplateRepository.getInstance();
        const template = repo.getById(msg.id);

        if (template) {
            return {
                success: true,
                template: template.toUnitTemplateDTO(),
            };
        } else {
            return { success: false };
        }
    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new TemplateController();
        }

        return this.instance;
    }
}