function cosinesim(A, B) {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < A.length; i++) {
        dotproduct += (A[i] * B[i]);
        mA += (A[i] * A[i]);
        mB += (B[i] * B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return (dotproduct) / ((mA) * (mB));
}

function dotProduct(vecA, vecB) {
    let product = 0;
    for (let i = 0; i < vecA.length; i++) {
        product += vecA[i] * vecB[i];
    }
    return product;
}

function magnitude(vec) {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) {
        sum += vec[i] * vec[i];
    }
    return Math.sqrt(sum);
}

function cosineSimilarity(vecA, vecB) {
    let dotProductValue = dotProduct(vecA, vecB);
    let magnitudeValue = magnitude(vecA) * magnitude(vecB);

    return dotProductValue / magnitudeValue;
}

const fs = require('fs');
const readline = require('readline');

const readFile = async (filename) => {
    const fileStream = fs.createReadStream(filename);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });
    const arr = [];
    for await (const line of rl) {
        arr.push(line);
    }
    return arr;
};

function contentToMap(content) {
    const allRatings = new Map();
    for (let i = 1; i < content.length; i++) {
        const ratings = content[i].split(',');
        let value1 = ratings.slice(1).map(value => +value);
        allRatings.set(ratings[0], value1);
    }
    return allRatings;
}

function fillZerosByPredictions(allRatings) {
    // let users = content[0].split(',');

    const articlesCount = Array.from(allRatings.keys()).length;
    const usersCount = Array.from(allRatings.values())[0].length;
    const neighborsCount = 2;

    let predictedCount = 0;

    for (let i = 0; i < articlesCount; i++) {
        for (let j = 0; j < usersCount; j++) {
            const predictedArticle = `Статья ${i + 1}`;
            const articleRatings = allRatings.get(predictedArticle);
            if (articleRatings[j] !== 0) {
                continue;
            }

            const similarities = getSimilarities(allRatings, predictedArticle, neighborsCount, j);
            const userRatings = getUserRatings(allRatings, similarities, j);

            articleRatings[j] = predict(Array.from(similarities.values()), userRatings, neighborsCount);
            predictedCount++;
        }
    }

    allRatings.forEach((value) => {
        let str = '';
        value.forEach(v1 => str += `${v1.toFixed(2).replace('.', ',')} `);
        console.log(str);
    });
}

function getUserRatings(allRatings, ratingsForPrediction, predictedUser) {
    const arr = [];
    ratingsForPrediction.forEach((value, key) => {
        arr.push(allRatings.get(key)[predictedUser]);
    });
    return arr;
}

function getSimilarities(map, predictedArticle, neighborsCount, userIndex) {
    const article1 = map.get(predictedArticle);
    const neighbors = new Map();
    map.forEach((value, key) => {
        if (predictedArticle === key) {
            return;
        }
        const a = removeItem([...article1], userIndex);
        const b = removeItem([...value], userIndex);
        const cosinesim1 = cosinesim(a, b);
        neighbors.set(key, 1 - cosinesim1);
    });

    const keys = Array.from(neighbors.keys());
    keys.sort((a, b) => {
        const aValue = neighbors.get(a);
        const bValue = neighbors.get(b);
        return aValue > bValue ? 1 : -1;
    });

    const result = new Map();
    keys.slice(0, neighborsCount).forEach(value => {
        result.set(value, neighbors.get(value));
        // console.log(`${value} = ${neighbors.get(value)}`);
    });

    return result;
}

function predict(similarity, ratings, neighbors_count) {
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < neighbors_count; i++) {
        const weight = 1 - similarity[i];
        numerator += weight * ratings[i];
        denominator += weight;
    }

    return numerator / denominator;
}

async function justStart() {
    fillZerosByPredictions(await readFile('file.csv'));
}

// justStart();

function removeItem(arr, index) {
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

async function evaluation() {
    const content = await readFile('evaluation.csv');
    fillZerosByPredictions(contentToMap(content));
}

// evaluation();

function mae() {


}

async function mse() {
    const content = await readFile('evaluation.csv');
    const allRatings = contentToMap(content);

    const mseArr = [];
    const maeArr = [];

    allRatings.forEach((value, key) => {
        const valueCopy = [...value];
        for (let j = 0; j < value.length; j++) {
            value[j] = 0;
            fillZerosByPredictions(allRatings);
            const predictedValue = allRatings.get(key)[j];
            mseArr.push(calcMse(predictedValue, valueCopy[j]));
            maeArr.push(calcMae(predictedValue, valueCopy[j]));
            value[j] = valueCopy[j];
            console.log('--------------------');
        }
    });

    const reducedMse = mseArr.reduce((previousValue, currentValue) => previousValue + currentValue);
    const calculatedMse = (1 / mseArr.length) * reducedMse;
    console.log('MSE = ' + calculatedMse);

    const reducedMae = maeArr.reduce((previousValue, currentValue) => previousValue + currentValue);
    const mae = (1 / maeArr.length) * reducedMae;
    console.log('MAE = ' + mae);

    console.log('RMSE = ' + Math.sqrt(calculatedMse));

    //     for (let j = 0; j < usersCount; j++) {
    //
    //     }
    // }
}

function calcMse(a, b) {
    return Math.pow(a - b, 2);
}

function calcMae(a, b) {
    return Math.abs(a - b);
}

mse();



