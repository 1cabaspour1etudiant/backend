import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export abstract class AbstractWriteSponsorshipDto {
    @ApiProperty()
    @IsInt()
    @Min(1)
    sponsorshipId: number;
}
