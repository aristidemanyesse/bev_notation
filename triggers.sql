create or replace function generate_evaluations_for_new_agent()
returns trigger as $$
declare
  f record;
  a record;
begin
  -- Pour chaque campagne active
  for f in
    select id from forms where is_active = true
  loop
    -- Les autres agents évaluent le nouveau
    for a in
      select id from agents where id <> new.id
    loop
      insert into evaluations (
        form_id,
        evaluator_id,
        evaluated_id
      )
      values (f.id, a.id, new.id)
      on conflict do nothing;

      -- Le nouveau évalue les autres
      insert into evaluations (
        form_id,
        evaluator_id,
        evaluated_id
      )
      values (f.id, new.id, a.id)
      on conflict do nothing;
    end loop;
  end loop;

  return new;
end;
$$ language plpgsql;



create trigger on_agent_created
after insert on agents
for each row
execute function generate_evaluations_for_new_agent();
