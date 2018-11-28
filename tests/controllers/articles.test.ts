import { useTestDatabase } from '../config/index';

const {
    listArticles,
    getRelatedArticles,
    getRelatedArticlesToArticleObject,
    calculateReadingTime,
    addReadingTimeToArticles,
    getArticle,
    addArticle,
    modifyArticles,
    deleteArticle,
} = require('../../controllers/articles');

useTestDatabase();

const newArticle = {
    title: 'newtitle',
    subtitle: 'newsubtitle',
    slug: 'new-title',
    image_url: 'http://placekitten.com/400/400',
    summary: 'the summary',
    html_content: 'the content',
    author: 1,
    category: 1,
    related_articles: [1, 2],
};

describe('Articles Controller', () => {
    test('listArticles should return articles array', async () => {
        expect.assertions(1);
        const articles = await listArticles();
        expect(articles.length).toBeGreaterThan(0);
    });

    test('listArticles articles should include reading time', async () => {
        expect.assertions(1);
        const articles = await listArticles();
        expect(typeof articles[0].reading_time).toBe('number');
    });

    test('addReadingTimeToArticles should add reading time', async () => {
        expect.assertions(1);
        let testString = '';
        for (let i = 0; i < 2750; i += 1) {
            testString += 'word ';
        }
        const testInput = [{ html_content: testString }];
        const expectedOutput = [{ html_content: testString, reading_time: 10 }];
        const receivedArticles = addReadingTimeToArticles(testInput);
        expect(receivedArticles).toEqual(expectedOutput);
    });

    // test('listArticles should not list hidden articles', async () => {
    //     expect.assertions(1);
    //     const articles = await listArticles;
    //     expect(articles.length).toBeGreaterThan(0);
    // });

    // test('listArticles should not list articles from the future', async () => {
    //     expect.assertions(1);
    //     const articles = await listArticles;
    //     expect(articles.length).toBeGreaterThan(0);
    // });

    test('getArticle should return an article with content', async () => {
        expect.assertions(14);
        const article = await getArticle(1);
        expect(typeof article.id).toBe('number');
        expect(typeof article.title).toBe('string');
        expect(typeof article.subtitle).toBe('string');
        expect(typeof article.slug).toBe('string');
        expect(article.posted_on).toBeInstanceOf(Date);
        expect(typeof article.article_image_url).toBe('string');
        expect(typeof article.summary).toBe('string');
        expect(typeof article.html_content).toBe('string');
        expect(typeof article.author_name).toBe('string');
        expect(typeof article.author_role).toBe('string');
        expect(typeof article.author_image_url).toBe('string');
        expect(typeof article.category_name).toBe('string');
        expect(typeof article.category_slug).toBe('string');
        expect(typeof article.reading_time).toBe('number');
    });

    test('calculateReadingTime should calculate reading time', async () => {
        const wordsPerMinute = 275;
        let testString = '';
        for (let i = 0; i < 2750; i += 1) {
            testString += 'word ';
        }
        const calculatedReadingTime = calculateReadingTime(testString);
        expect(calculatedReadingTime).toBe(10);
    });

    test('calculateReadingTime should round down', async () => {
        const wordsPerMinute = 275;
        let testString = '';
        for (let i = 0; i < 2760; i += 1) {
            testString += 'word ';
        }
        const calculatedReadingTime = calculateReadingTime(testString);
        expect(calculatedReadingTime).toBe(10);
    });

    test('calculateReadingTime should round down', async () => {
        const wordsPerMinute = 275;
        let testString = '';
        for (let i = 0; i < 2740; i += 1) {
            testString += 'word ';
        }
        const calculatedReadingTime = calculateReadingTime(testString);
        expect(calculatedReadingTime).toBe(9);
    });

    // test('getArticle should list reading time', async () => {
    // });

    test('getRelatedArticles should return an article array', async () => {
        expect.assertions(14);
        const relatedArticles = await getRelatedArticles(1);
        const article = relatedArticles[0];
        expect(typeof article.id).toBe('number');
        expect(typeof article.title).toBe('string');
        expect(typeof article.subtitle).toBe('string');
        expect(typeof article.slug).toBe('string');
        expect(article.posted_on).toBeInstanceOf(Date);
        expect(typeof article.article_image_url).toBe('string');
        expect(typeof article.summary).toBe('string');
        expect(typeof article.author_name).toBe('string');
        expect(typeof article.author_role).toBe('string');
        expect(typeof article.author_image_url).toBe('string');
        expect(typeof article.html_content).toBe('string');
        expect(typeof article.category_name).toBe('string');
        expect(typeof article.category_slug).toBe('string');
        expect(typeof article.reading_time).toBe('number');
    });

    // test('addArticle should add an article correctly', async () => {
    // });

    // test('addArticle should work with custom posted_on', async () => {
    // });

    // test('modifyArticle should modify an article correctly', async () => {
    // });

    // test('deleteArticle should delete an article', async () => {
    // });
});
