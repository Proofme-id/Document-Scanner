import { EImageType } from "../enums/imageType.enum";

export interface IImage {
    type: EImageType;
    base64Source: string;
}