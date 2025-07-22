import {ConstructionEmitter, MessageType} from "../shared/tether/messages/Construction";
import {Building} from "../shared/data/ts/BuildingDefs";

export namespace StupidTest {
    async function fetchQueue() {
        const response = await ConstructionEmitter.server.invoke(
            MessageType.GetCurrentQueueRequest,
            MessageType.GetCurrentQueueResponse,
            {}
        );
        print("Queue:", response.data);
    }

    async function tryStartConstruction() {
        const response = await ConstructionEmitter.server.invoke(
            MessageType.StartConstructionRequest,
            MessageType.StartConstructionResponse,
            {
                targetId: "R001",
                building: Building.CivilianFactory,
            }
        );
        print("Start construction response:", response.success);
    }

    async function moveConstruction() {
        const response = await ConstructionEmitter.server.invoke(
            MessageType.MoveConstructionRequest,
            MessageType.MoveConstructionResponse,
            { constructionId: "1", position: 0 }
        );
        print("Move response:", response.success);
    }

    async function cancelConstruction() {
        const response = await ConstructionEmitter.server.invoke(
            MessageType.CancelConstructionRequest,
            MessageType.CancelConstructionResponse,
            { constructionId: "1" }
        );
        print("Cancel response:", response.success);
    }

    export function test() {
        tryStartConstruction();
        // tryStartConstruction();
        // tryStartConstruction();
        // wait(1);
        // fetchQueue();
        // wait(1);
        // moveConstruction();
        // wait(5);
        // cancelConstruction();
        // wait(3);
    }

}