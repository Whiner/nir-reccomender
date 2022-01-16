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


async function start(content) {
    // let users = content[0].split(',');
    const allRatings = new Map();
    let articlesCount;
    const usersCount = content.length - 1;
    const neighborsCount = 2;
    for (let i = 1; i < content.length; i++) {
        const ratings = content[i].split(',');
        let value1 = ratings.slice(1).map(value => +value);
        allRatings.set(ratings[0], value1);
        articlesCount = value1.length;
    }

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
    // while (!allFilled) {
    //     userIndex++;
    //     if (userIndex === usersCount + 1) {
    //         articleIndex++;
    //         userIndex = 0;
    //         if (articleIndex === articlesCount + 1) {
    //             break;
    //         }
    //     }
    //
    //     const predictedArticle = `Статья ${articleIndex + 1}`;
    //     const articleRatings = allRatings.get(predictedArticle);
    //     if (articleRatings[userIndex] !== 0) {
    //         continue;
    //     }
    //
    //     const similarities = getSimilarities(allRatings, predictedArticle, neighborsCount, userIndex);
    //     const userRatings = getUserRatings(allRatings, similarities, userIndex);
    //
    //     articleRatings[userIndex] = predict(Array.from(similarities.values()), userRatings, neighborsCount);
    //     predictedCount++;
    // }

    allRatings.forEach((value, key) => {
        let str = '';
        value.forEach(v1 => str += `${v1.toString().replace('.', ',')} `);
        console.log(str);
    });

    // for (let j = 0; j < 10; j++) {
    //     const predictedArticle = `Статья ${j + 1}`;
    //     let str = '';
    //     for (let i = 0; i < 10; i++) {
    //         const predictedUser = i;
    //         const similarities = getSimilarities(allRatings, predictedArticle);
    //         const userRatings = getUserRatings(allRatings, similarities, predictedUser);
    //         const predict1 = predict(Array.from(similarities.values()), userRatings, 3);
    //         const articleRatings = allRatings.get(predictedArticle);
    //         if (articleRatings[predictedUser] === 0) {
    //             articleRatings[predictedUser] = predict1;
    //             str += (`${predict1.toString().replace('.', ',')} `);
    //         } else {
    //             str += (`${articleRatings[predictedUser].toString().replace('.', ',')} `);
    //         }
    //
    //         // console.log(`Предсказанное значение для ${predictedArticle} от ${users[predictedUser]} равно ${predict1.toString().replace('.', ',')}`);
    //     }
    // console.log(str);


}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
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
    start(await readFile('file.csv'));
}

// justStart();

function removeItem(arr, index) {
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

async function evaluation() {
    start(await readFile('evaluation.csv'));
}

evaluation();

function mae() {

}

function mse(defaultRatings, predictedRatings, ) {
    const answersCount = 10;
    for (let i = 0; i < answersCount; i++) {

    }
}

function rmse() {

}
