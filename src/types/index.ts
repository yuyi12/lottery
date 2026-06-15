export interface LotteryRecord {
  id: number;
  code: string;
  drawDate: string;
  red1: number;
  red2: number;
  red3: number;
  red4: number;
  red5: number;
  red6: number;
  blue: number;
  sumValue: number;
  bigSmallRatio: string;
  oddEvenRatio: string;
  span: number;
  threeZoneRatio: string;
  acValue: number;
  route012Ratio: string;
  prizegrades?: any;
  content?: string;
  poolmoney?: string;
}

export interface PrizeGrade {
  type: number;
  typenum: string;
  typemoney: string;
}

export interface CreateRecordInput {
  json: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthResponse {
  token: string;
  email: string;
}

export interface ApiError {
  error: string;
}
