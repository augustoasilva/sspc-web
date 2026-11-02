// CI break 2 (test): this assertion fails on purpose.
describe('CI break', () => {
  it('given one and two, when compared, then they are equal', () => {
    // given / when / then
    expect(1).toBe(2);
  });
});
