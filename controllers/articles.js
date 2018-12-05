/* eslint max-len: ["error", { "code": 100 }] */
/* eslint-disable prettier/prettier */

const { knex } = require('../helpers');

const fieldsBase = [
    'articles.id',
    'articles.title',
    'articles.subtitle',
    'articles.slug',
    'articles.posted_on',
    'article_content.image_url AS article_image_url',
    'article_content.summary',
    'authors.name AS author_name',
    'authors.role AS author_role',
    'authors.image_url AS author_image_url',
    'categories.name AS category_name',
    'categories.slug AS category_slug',
];

const calculateReadingTime = text => {
    try {
        const wordsPerMinute = 275;
        const wordArr = text.split(' ');
        const textWordAmount = wordArr.length;
        const readingTimeInMinutes = Math.floor(textWordAmount / wordsPerMinute);
        return readingTimeInMinutes;
    } catch (err) {
        return null;
    }
};

const addReadingTimeToArticles = articles => {
    const articlesWithReadingTime = articles.map(article => {
        const articleContent = article.html_content;
        const readingTime = calculateReadingTime(articleContent);
        const readingTimeObject = { reading_time: readingTime };
        const updatedArticle = Object.assign({}, article, readingTimeObject);
        return updatedArticle;
    });
    return articlesWithReadingTime;
};

const listArticles = async () => {
    const fields = [
        ...fieldsBase,
        'article_content.html_content',
    ];
    const articles = await knex
        .select(fields)
        .from('articles')
        .join('article_content', 'article_content.article_id', '=', 'articles.id')
        .join('categories', 'categories.id', '=', 'articles.category')
        .join('authors', 'authors.id', '=', 'articles.author')
        .where('articles.hidden', '=', false)
        .andWhere('articles.posted_on', '<=', knex.raw('now()'));
    const articlesWithReadingTime = addReadingTimeToArticles(articles);
    return articlesWithReadingTime;
};

const getRelatedArticles = async id => {
    const fields = [
        ...fieldsBase,
        'article_content.html_content',
    ];
    const relatedArticles = await knex
        .select(fields)
        .from('articles')
        .join('article_content', 'article_content.article_id', '=', 'articles.id')
        .join('categories', 'categories.id', '=', 'articles.category')
        .join('authors', 'authors.id', '=', 'articles.author')
        .join('related_articles', 'related_articles.related_article_id', '=', 'articles.id')
        .where('related_articles.article_id', '=', id)
        .andWhere('articles.hidden', '=', false)
        .andWhere('articles.posted_on', '<=', knex.raw('now()'));
    const articlesWithReadingTime = addReadingTimeToArticles(relatedArticles);
    return articlesWithReadingTime;
};

const addRelatedArticlesToArticleObject = async (id, article) => {
    const relatedArticles = await getRelatedArticles(id);
    if (relatedArticles.length === 0) {
        return article;
    }
    const articleWithRelatedArticles = {
        ...article,
        related_articles: relatedArticles,
    };
    return articleWithRelatedArticles;
};

const getArticle = async id => {
    const fields = [
        ...fieldsBase,
        'article_content.html_content',
    ];
    const articles = await knex
        .select(fields)
        .from('articles') // eslint-disable-next-line
        .join('article_content', 'article_content.article_id', '=', 'articles.id')
        .join('categories', 'categories.id', '=', 'articles.category')
        .join('authors', 'authors.id', '=', 'articles.author')
        .where('articles.id', '=', id);
    const articlesWithReadingTime = addReadingTimeToArticles(articles);
    const articleBase = articlesWithReadingTime[0];
    const article = await addRelatedArticlesToArticleObject(id, articleBase);
    return article;
};

const addToArticlesTable = async articleData => {
    const returning = ['id', 'title', 'subtitle', 'posted_on', 'slug', 'author', 'category'];
    const addedArticle = await knex('articles')
        .insert([articleData])
        .returning(returning);
    return addedArticle[0];
};

const addToArticleContentTable = async articleData => {
    const returning = ['summary', 'image_url', 'html_content'];
    const addedArticle = await knex('article_content')
        .insert([articleData])
        .returning(returning);
    return addedArticle[0];
};

const generateRelatedArticles = (id, relatedArticles) => {
    const relatedArticlesObjects = relatedArticles.map(relatedArticle => {
        const relatedArticleObject = {
            article_id: id,
            related_article_id: relatedArticle,
        };
        return relatedArticleObject;
    });
    return relatedArticlesObjects;
};

const addToRelatedArticlesTable = async (id, relatedArticles) => {
    if (!relatedArticles || relatedArticles.length === 0) {
        return [];
    }
    const relatedArticlesArray = generateRelatedArticles(id, relatedArticles);
    const addedRelatedArticles = await knex('related_articles')
        .insert(relatedArticlesArray)
        .returning('article_id', 'related_article_id');
    return addedRelatedArticles;
};

const addArticle = async article => {
    const articleData = {
        title: article.title,
        subtitle: article.subtitle,
        posted_on: article.posted_on,
        hidden: article.hidden,
        slug: article.slug,
        author: article.author,
        category: article.author,
    };
    const addedArticleData = await addToArticlesTable(articleData);
    const addedArticleId = addedArticleData.id;
    const articleContentData = {
        article_id: addedArticleId,
        summary: article.summary,
        image_url: article.image_url,
        html_content: article.html_content,
    };
    await addToArticleContentTable(articleContentData);
    const relatedArticleIds = article.related_articles;
    await addToRelatedArticlesTable(addedArticleId, relatedArticleIds);
    const createdArticle = await getArticle(addedArticleId);
    return createdArticle;
};

// TODO: Test better
const modifyArticle = async (id, article) => {
    const articleDataFields = ['title', 'subtitle', 'posted_on', 'hidden', 'slug', 'author', 'category'];
    const articleContentDataFields = ['article_id', 'summary', 'image_url', 'html_content'];

    const articleData = {};
    const articleContentData = {};

    articleDataFields.forEach(async field => {
        if (article[field] !== undefined) {
            if (Object.keys(articleData).length !== 0) {
                await knex('articles')
                    .where('id', '=', id)
                    .update(field, article[field]);
            }
        }
    });
    articleContentDataFields.forEach(field => {
        if (article[field] !== undefined) {
            articleContentData[field] = article[field];
        }
    });

    // if (Object.keys(articleContentData).length !== 0) {
    //     await knex('article_content')
    //         .where('article_id', '=', id)
    //         .update(articleContentData);
    // }



    // const relatedArticlesData = article.relatedArticles;
    // if (relatedArticlesData && relatedArticlesData.length > 0) {
    //     // eslint-disable-next-line
    //     const relatedArticles = relatedArticlesData.map(relatedArticle => {
    //         return {
    //             article_id: id,
    //             related_article_id: relatedArticle,
    //         };
    //     });
    //     await knex('related_articles')
    //         .where('article_id', '=', id)
    //         .delete();
    //     await knex('related_articles')
    //         .insert(relatedArticles);
    // }

    const modifiedArticle = await getArticle(id);
    return modifiedArticle;
};

const deleteArticle = async id => {
    await knex('related_articles')
        .where({ article_id: id })
        .orWhere({ related_article_id: id })
        .delete();
    await knex('article_content')
        .where({ article_id: id })
        .delete();
    await knex('articles')
        .where({ id })
        .delete();
    return { id };
};

module.exports = {
    listArticles,
    getRelatedArticles,
    addRelatedArticlesToArticleObject,
    calculateReadingTime,
    addReadingTimeToArticles,
    addToRelatedArticlesTable,
    getArticle,
    generateRelatedArticles,
    addArticle,
    modifyArticle,
    deleteArticle,
};
