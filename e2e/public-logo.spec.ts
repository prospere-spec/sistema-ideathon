import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`public logo is displayed once without clipping at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/public/ideathons/logo-test", (route) => route.fulfill({
      json: { data: {
        name: "Ideathon de teste",
        description: "Teste do cabecalho publico",
        status: "LIVE",
        timezone: "America/Sao_Paulo",
        startsAt: null,
        endsAt: null,
        phases: [],
        ideas: [],
      } },
    }));
    await page.goto("/ideathons/logo-test");

    const header = page.locator("main > header");
    const link = header.getByRole("link", { name: /página inicial/ });
    const logo = header.getByRole("img", { name: "Revvolução", exact: true });
    await expect(logo).toHaveCount(1);
    await expect(logo).toBeVisible();
    // A CSS background can duplicate the logo without adding another img element.
    await expect(link).toHaveCSS("background-image", "none");
    await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

    const imageBox = (await logo.boundingBox())!;
    for (const container of [link, header]) {
      const box = (await container.boundingBox())!;
      expect(imageBox.x).toBeGreaterThanOrEqual(box.x);
      expect(imageBox.y).toBeGreaterThanOrEqual(box.y);
      expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(box.x + box.width + 1);
      expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(box.y + box.height + 1);
    }
    expect(imageBox.width).toBeGreaterThan(0);
    expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(width);
  });
}
