from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('order_payment', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='payment_status',
            field=models.CharField(
                max_length=20,
                choices=[('Waiting', 'Waiting'), ('Complete', 'Complete'), ('Cancelled', 'Cancelled')],
                default='Waiting',
            ),
        ),
        migrations.AlterField(
            model_name='saleorder',
            name='order_status',
            field=models.CharField(
                max_length=20,
                choices=[('Pending', 'Pending'), ('Received', 'Received'), ('In transit', 'In transit'), ('Cancelled', 'Cancelled')],
                default='Pending',
            ),
        ),
    ]
