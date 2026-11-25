const shapes:Record<string,string>={
  longsword:'M8 26l4 4m-6-2 6-6m-1 8 4-4M13 23 27 7l5-2-1 6-16 15',
  greatsword:'M6 29l5 5 6-6m-9-3 9 9m-5-9L25 7l8-4-2 10-15 16',
  axe:'M10 31 26 8m-12 9L9 8l7 2 7-5 8 4-3 10-8-2-4 5z',
  staff:'M12 34 22 14m-3-4 6-7 5 7-7 8zm-2 13 6 3',
  shield:'M12 6l9-3 9 3v11c0 7-4 11-9 15-5-4-9-8-9-15z M21 9v15m-5-9h10',
  katana:'M7 31l8-8m-6-4 9 9m-5-4C22 19 29 12 31 4c1 11-4 18-15 23',
  potion:'M15 6h10m-8 0v8L9 24q0 8 11 8t11-8l-8-10V6m-11 17q8-4 16 0m-8-2v8m-4-4h8',
  armor:'M14 6l6 4 6-4 7 5-3 8-4-2 2 15H12l2-15-4 2-3-8z M14 21h12m-12 5h12',
  material:'M7 22l7-13 13-4 5 14-9 13-13-3zm7-13 2 13 7 10m-7-10 16-3',
  fang:'M11 9Q23 4 29 11 28 23 12 33l4-14z M18 11l4 3',
  coin:'M20 5a15 15 0 1 0 .01 0z M20 10a10 10 0 1 0 .01 0z M20 14v12m-4-8h8',
  Fire:'M19 34C7 31 9 19 15 15c0 4 2 5 2 5 0-9 4-11 7-16-1 11 10 13 8 22-1 5-6 9-13 8z',
  Lightning:'M21 4 10 21h10l-2 14 13-20H21z',
  Ice:'M20 4v32M6 12l28 16M6 28l28-16M16 8l4 4 4-4m-8 24 4-4 4 4',
  Water:'M20 5C18 11 8 20 8 25a12 12 0 1 0 24 0c0-5-10-14-12-20z M13 25q0 5 5 6',
  Wind:'M4 15h22c8 0 7-10 2-10m-24 17h28m-21 7h12c5 0 5 6 1 6',
};
export function Glyph({kind}:{kind:string}){
  return <svg className="item-glyph" viewBox="0 0 40 40" aria-hidden="true"><path d={shapes[kind]??shapes.material}/></svg>;
}
