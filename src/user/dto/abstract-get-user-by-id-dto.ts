import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsPositive } from "class-validator";

export abstract class GetUserByIdDto {
    @ApiProperty()
    @IsInt()
    @IsPositive()
    @Transform(({ value }) => parseInt(value))
    id:number;
}
