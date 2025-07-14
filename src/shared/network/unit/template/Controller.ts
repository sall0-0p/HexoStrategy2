import {UnitTemplateDTO} from "./DTO";

export interface GetTemplateRequest {
    type: "getTemplate",
    id: string,
}

export interface GetTemplateResponse {
    success: boolean,
    template?: UnitTemplateDTO,
}

export type UnitTemplateRequest = GetTemplateRequest;
export type UnitTemplateResponse = GetTemplateResponse;