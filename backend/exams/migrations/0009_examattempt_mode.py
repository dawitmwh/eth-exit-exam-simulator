from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0008_alter_competencyarea_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='examattempt',
            name='mode',
            field=models.CharField(choices=[('PRACTICE', 'Practice'), ('SIMULATED', 'Simulated')], default='SIMULATED', max_length=10),
        ),
    ]
