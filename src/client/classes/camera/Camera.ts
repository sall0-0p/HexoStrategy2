import {RunService, UserInputService, Workspace} from "@rbxts/services";

export class Camera {
    private cameraPart: Part;
    private currentCamera;
    private cameraSpeed = 30 // Per tick;

    // tatgets
    private targetPosition = Vector3.zero;

    private static instance: Camera;
    private constructor() {
        const part = new Instance("Part");
        part.Size = new Vector3(1, 1, 1);
        part.Anchored = true;
        part.CanCollide = false;
        part.Position = new Vector3(0, 2, 0);
        part.Parent = Workspace;
        this.cameraPart = part;

        this.currentCamera = Workspace.CurrentCamera!;
        this.currentCamera.CameraType = Enum.CameraType.Scriptable;

        RunService.BindToRenderStep("CameraRendering", Enum.RenderPriority.Camera.Value - 2, (delta) => this.onRender(delta));
    }

    private processArrowKeys(delta: number) {
        let directionVector = new Vector3(0, 0 ,0);
        if (UserInputService.IsKeyDown(Enum.KeyCode.Up)) {
            directionVector = directionVector.add(new Vector3(0, 0, 1));
        }

        if (UserInputService.IsKeyDown(Enum.KeyCode.Down)) {
            directionVector = directionVector.add(new Vector3(0, 0, -1));
        }

        if (UserInputService.IsKeyDown(Enum.KeyCode.Left)) {
            directionVector = directionVector.add(new Vector3(1, 0, 0));
        }

        if (UserInputService.IsKeyDown(Enum.KeyCode.Right)) {
            directionVector = directionVector.add(new Vector3(-1, 0, 0));
        }

        const adjustedSpeed = this.cameraSpeed
        const positionChange = directionVector.mul(adjustedSpeed * delta);
        this.targetPosition = this.cameraPart.Position.add(positionChange);
        this.lerpPositionToTarget(delta);
    }

    private lerpPositionToTarget(delta: number) {
        const alpha = 1 - math.exp(this.cameraSpeed * delta);
        this.cameraPart.Position = this.cameraPart.Position.Lerp(this.targetPosition, math.clamp(-alpha, 0, 1));
    }

    private onRender(delta: number) {
        this.processArrowKeys(delta);

        const cameraCFrame = new CFrame(this.cameraPart.Position.add(new Vector3(0, 10, 0)));
        this.currentCamera.CFrame = cameraCFrame.mul(CFrame.Angles(math.rad(45), math.rad(180), 0));
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new Camera();
        }
        return this.instance;
    }
}