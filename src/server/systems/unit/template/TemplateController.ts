import {ReplicatedStorage} from "@rbxts/services";

const controller = ReplicatedStorage.WaitForChild("Events")
    .WaitForChild("Controllers")
    .WaitForChild("TemplateController");

export class TemplateController {
    private static instance: TemplateController;
    private constructor() {}

    private getById() {

    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new TemplateController();
        }

        return this.instance;
    }
}