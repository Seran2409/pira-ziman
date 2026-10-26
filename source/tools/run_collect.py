import sys, json, asyncio, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto('file://' + ROOT + '/dist/pira-ziman.html'); await pg.wait_for_timeout(400)
        res = await pg.evaluate(open(ROOT + '/tools/collect.js').read())
        json.dump(res['items'], open(ROOT + '/audio_build/items.json', 'w'), ensure_ascii=False)
        print('phrases', res['nPhrases'], 'words', res['nWords'], 'items', len(res['items']))
        await b.close()
asyncio.run(main())
