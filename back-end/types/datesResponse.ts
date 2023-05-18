interface DatesResponse {
  status: number;
  data: {
    expirations: null | {
      date: string[];
    };
  };
}

export default DatesResponse;