### Ting som må gjøres

Kun testet med docker via temporary database, alt fungerte

docker run --name matlager-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=matlager_db -p 3306:3306 -d mysql:8

1. MYSQL må legges til i prosjektet

2. dotnet ef migrations add InitialIdentityAndHouseholds     --- må kjøres i backend folder
3. dotnet ef database update                --- må kjøres