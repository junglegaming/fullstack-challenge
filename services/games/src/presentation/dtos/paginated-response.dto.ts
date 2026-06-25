import { ApiProperty } from "@nestjs/swagger";

export class PaginatedMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 1 })
  page?: string;

  @ApiProperty({ required: false, default: 20 })
  limit?: string;
}
