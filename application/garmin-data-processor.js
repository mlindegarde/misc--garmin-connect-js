import * as Convert from '../utilities/convert.js';
import * as Number from '../utilities/numbers.js';

class GarminDataProcessor {
    convertWeightDataToModel(garminData) {
        return garminData.dailyWeightSummaries
            .flatMap(summary => summary.allWeightMetrics)
            .map(metric => ({
                timestamp: new Date(metric.date),
                weightInLbs: Convert.gramsToPounds(metric.weight),
                bmi: Number.round(metric.bmi)
            }));
    }
}

export { GarminDataProcessor }