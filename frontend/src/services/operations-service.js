import {HttpUtils} from "../utils/http-utils";

export class OperationsService {

    static async getOperations (period, dateFromElement = null, dateToElement = null) {
            let params = `?period=${period}`;
            if (period === 'interval' && dateFromElement && dateToElement) {
                params += `&dateFrom=${dateFromElement.value}&dateTo=${dateToElement.value}`;
            }
            else if (period === 'today') {
                const today = new Date().toISOString().slice(0, 10);
                params = `?period=interval&dateFrom=${today}&dateTo=${today}`;
            }
            const result = await HttpUtils.request(`/operations${params}`, 'GET');
            return result.response;
        };

}