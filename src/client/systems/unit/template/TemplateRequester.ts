import {ReplicatedStorage} from "@rbxts/services";
import {UnitTemplateDTO} from "../../../../shared/network/unit/template/DTO";
import {GetTemplateRequest, GetTemplateResponse} from "../../../../shared/network/unit/template/Controller";

export namespace TemplateRequester {
    const controller = ReplicatedStorage.WaitForChild("Events")
        .WaitForChild("Controllers")
        .WaitForChild("TemplateController") as RemoteFunction;

    const cache = new Map<string, UnitTemplateDTO>();
    export function getTemplate(id: string, useCache: boolean = false): UnitTemplateDTO | undefined {
        const response: GetTemplateResponse = controller.InvokeServer({
            type: "getTemplate",
            id: id,
        } as GetTemplateRequest);

        if (useCache && cache.has(id)) {
            return cache.get(id);
        }

        if (response.success && response.template) {
            cache.set(id, response.template);
            return response.template;
        }

        return undefined;
    }

    export function clearAllCache() {
        cache.clear();
    }

    export function invalidate(id: string) {
        cache.delete(id);
    }
}