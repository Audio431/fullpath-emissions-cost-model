from selenium import webdriver
from selenium.webdriver.common.by import By
import trio
# from selenium.webdriver.common.devtools.v128.network import Headers
# import base64

async def test_performance_amazon_buy_now():
    options = webdriver.ChromeOptions()
    options.add_argument("-headless")
    driver = webdriver.Chrome(options=options)
  
    async with driver.bidi_connection() as connection:
            # await connection.session.execute(connection.devtools.network.enable())
            await connection.session.execute(connection.devtools.performance.enable())

            # credentials = base64.b64encode("admin:admin".encode()).decode()
            # auth = {'authorization': 'Basic ' + credentials}
            # await connection.session.execute(connection.devtools.network.set_extra_http_headers(Headers(auth)))

            metric_list = await connection.session.execute(connection.devtools.performance.get_metrics())
            
            driver.get("https://www.amazon.co.uk/fire-tv-stick-4k/dp/B0BTFRN4K6?ref=dlx_deals_dg_dcl_B0BTFRN4K6_dt_sl14_cf")

    driver.execute_script("return document.getElementById('buy-now-button').click()")

    metrics = {metric.name: metric.value for metric in metric_list}
    for k, v in metrics.items():
        print(f"{k}: {v}")

trio.run(test_performance_amazon_buy_now)